# Transfer Receipt & Discrepancy Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ungated client receipt write with a destination-scoped `receive_transfer` RPC that records per-line quantity + condition, blocks over-receipt, lands all received stock in the destination warehouse, and tracks discrepancies on a separate dimension with a resolution step.

**Architecture:** Receipt becomes a SECURITY DEFINER RPC (validation, condition, over-receipt block, discrepancy capture, notifications) plus a thin server action and DB authority guard — mirroring the approval-chain pattern. Inventory addition stays in the refactored `process_transfer_dispatch_receipt` trigger (fires on `status → received`, caller-independent). Discrepancy lives on a new `discrepancy_status` column (`none|open|resolved`), never on `status`, so resolution never re-adds stock.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (Postgres), vitest.

## Global Constraints

- Receiver authorization: role ∈ (`hq_logistics`,`dg`,`sysadmin`) OR role ∈ (`district_officer`,`field_officer`) AND `user_has_warehouse(destination_warehouse_id)`. Source-side users cannot receive.
- Condition is quantity-only: all `quantity_received` adds to destination available stock regardless of `condition`; condition is stored on the line for audit.
- Discrepancy = any line where `quantity_received <> quantity_dispatched` OR `condition <> 'good'`. Requires a reason; status stays `received`; `discrepancy_status='open'`.
- Over-receipt (`quantity_received > quantity_dispatched`) is rejected.
- Resolution allowed to `hq_logistics`/`dg`/`sysadmin` or a source-warehouse `district_officer`/`field_officer`; requires a note; flips `discrepancy_status` `open → resolved` only.
- Proof of delivery = `received_by` + `received_at` only (no signature/photo for PoD).
- Migrations are append-only; next free numbers are `00019`–`00021`.
- DB is the source of truth; client `canReceive*` checks are UX only.
- `item_condition` enum (existing): `good|damaged|expired|missing`. `current_user_role()`, `user_has_warehouse(uuid)` exist (`00007`).
- No SQL unit-test harness; SQL tasks are verified by applying migrations to a DB and running assertion `SELECT`s (local stack `postgresql://postgres:postgres@127.0.0.1:54322/postgres`, or the linked project).

---

### Task 1: Receiver/resolver helpers + types

**Files:**
- Modify: `nadmo-wms-app/lib/auth.ts`
- Test: `nadmo-wms-app/lib/auth.test.ts`
- Modify: `nadmo-wms-app/types/index.ts`

**Interfaces:**
- Produces: `RECEIVER_ROLES: UserRole[]`, `canReceiveTransfer(role): boolean`, `canResolveDiscrepancy(role): boolean`; type `DiscrepancyStatus`; new `TransferOrder` fields.

- [ ] **Step 1: Write the failing tests**

Append to `nadmo-wms-app/lib/auth.test.ts`:

```typescript
import { RECEIVER_ROLES, canReceiveTransfer, canResolveDiscrepancy } from './auth';

describe('receipt helpers', () => {
  it('lists receiver roles', () => {
    expect(RECEIVER_ROLES).toEqual([
      'district_officer', 'field_officer', 'hq_logistics', 'dg', 'sysadmin',
    ]);
  });

  it('gates who may receive', () => {
    expect(canReceiveTransfer('district_officer')).toBe(true);
    expect(canReceiveTransfer('field_officer')).toBe(true);
    expect(canReceiveTransfer('hq_logistics')).toBe(true);
    expect(canReceiveTransfer('dg')).toBe(true);
    expect(canReceiveTransfer('sysadmin')).toBe(true);
    expect(canReceiveTransfer('auditor')).toBe(false);
    expect(canReceiveTransfer('regional_manager')).toBe(false);
    expect(canReceiveTransfer('readonly')).toBe(false);
  });

  it('gates who may resolve a discrepancy', () => {
    expect(canResolveDiscrepancy('hq_logistics')).toBe(true);
    expect(canResolveDiscrepancy('dg')).toBe(true);
    expect(canResolveDiscrepancy('sysadmin')).toBe(true);
    expect(canResolveDiscrepancy('district_officer')).toBe(true);
    expect(canResolveDiscrepancy('field_officer')).toBe(true);
    expect(canResolveDiscrepancy('auditor')).toBe(false);
    expect(canResolveDiscrepancy('regional_manager')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd nadmo-wms-app && npm run test -- auth`
Expected: FAIL — `RECEIVER_ROLES` not exported.

- [ ] **Step 3: Implement the helpers**

Append to `nadmo-wms-app/lib/auth.ts`:

```typescript
/** Roles that may confirm receipt (DB also checks destination-warehouse assignment). */
export const RECEIVER_ROLES: UserRole[] = [
  'district_officer',
  'field_officer',
  'hq_logistics',
  'dg',
  'sysadmin',
];

export function canReceiveTransfer(role: UserRole): boolean {
  return RECEIVER_ROLES.includes(role);
}

export function canResolveDiscrepancy(role: UserRole): boolean {
  return ['district_officer', 'field_officer', 'hq_logistics', 'dg', 'sysadmin'].includes(role);
}
```

- [ ] **Step 4: Add the types**

In `nadmo-wms-app/types/index.ts`, add after the `ApprovalAction` type:

```typescript
export type DiscrepancyStatus = 'none' | 'open' | 'resolved';
```

In `interface TransferOrder`, add after `rejection_reason`:

```typescript
  discrepancy_status: DiscrepancyStatus;
  discrepancy_resolved_by: string | null;
  discrepancy_resolved_at: string | null;
  discrepancy_resolution_note: string | null;
```

- [ ] **Step 5: Run tests + tsc to verify they pass**

Run: `cd nadmo-wms-app && npm run test -- auth && npx tsc --noEmit`
Expected: tests PASS; tsc no errors.

- [ ] **Step 6: Commit**

```bash
git add nadmo-wms-app/lib/auth.ts nadmo-wms-app/lib/auth.test.ts nadmo-wms-app/types/index.ts
git commit -m "feat(receipt): receiver/resolver helpers and discrepancy types"
```

---

### Task 2: Migration — receipt/discrepancy schema (`00019`)

**Files:**
- Create: `nadmo-wms-app/supabase/migrations/00019_receipt_discrepancy_schema.sql`

**Interfaces:**
- Produces enum `public.discrepancy_status`; new `transfer_orders` columns.

- [ ] **Step 1: Write the migration**

```sql
-- Migration: receipt & discrepancy schema

CREATE TYPE public.discrepancy_status AS ENUM ('none', 'open', 'resolved');

ALTER TABLE public.transfer_orders
  ADD COLUMN IF NOT EXISTS discrepancy_status public.discrepancy_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS discrepancy_resolved_by   UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS discrepancy_resolved_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discrepancy_resolution_note TEXT;
```

- [ ] **Step 2: Apply and verify**

Run:
```bash
cd nadmo-wms-app && supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
  SELECT column_name FROM information_schema.columns
  WHERE table_name='transfer_orders' AND column_name LIKE 'discrepancy_%' ORDER BY 1;"
```
Expected: rows `discrepancy_photos, discrepancy_reason, discrepancy_resolution_note, discrepancy_resolved_at, discrepancy_resolved_by, discrepancy_status`.

> If no local Docker, apply via the linked project instead: `supabase db push`.

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/supabase/migrations/00019_receipt_discrepancy_schema.sql
git commit -m "feat(db): receipt & discrepancy schema"
```

---

### Task 3: Migration — receipt workflow (`00020`)

**Files:**
- Create: `nadmo-wms-app/supabase/migrations/00020_receipt_workflow.sql`

**Interfaces:**
- Consumes: `current_user_role()`, `user_has_warehouse(uuid)`, `is_approver_role`, `role_level` (existing).
- Produces RPCs `receive_transfer(uuid, jsonb, text, text[])`, `resolve_discrepancy(uuid, text)`; refactored `process_transfer_dispatch_receipt`; extended `check_transfer_authority`.

- [ ] **Step 1: Write the migration**

```sql
-- Migration: receipt workflow (RPCs, refactored inventory trigger, authority guard)

-- 1) receive_transfer: validate, capture lines, flag discrepancy, set received.
CREATE OR REPLACE FUNCTION public.receive_transfer(
  p_transfer_id UUID, p_lines JSONB, p_reason TEXT, p_photos TEXT[]
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.transfer_orders;
  v_role public.user_role := public.current_user_role();
  v_line JSONB;
  v_item public.transfer_items;
  v_recv INT;
  v_cond public.item_condition;
  v_mismatch BOOLEAN := FALSE;
  v_uid UUID;
BEGIN
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Transfer % not found', p_transfer_id; END IF;
  IF t.status <> 'in_transit' THEN RAISE EXCEPTION 'Transfer is not in transit'; END IF;

  IF NOT (
    v_role IN ('hq_logistics','dg','sysadmin')
    OR (v_role IN ('district_officer','field_officer') AND public.user_has_warehouse(t.destination_warehouse_id))
  ) THEN
    RAISE EXCEPTION 'Not authorized to receive at destination warehouse';
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    SELECT * INTO v_item FROM public.transfer_items
      WHERE id = (v_line->>'item_id')::UUID AND transfer_id = p_transfer_id;
    IF v_item.id IS NULL THEN RAISE EXCEPTION 'Line % is not on this transfer', v_line->>'item_id'; END IF;
    v_recv := (v_line->>'quantity_received')::INT;
    v_cond := (v_line->>'condition')::public.item_condition;
    IF v_recv < 0 THEN RAISE EXCEPTION 'Received quantity cannot be negative'; END IF;
    IF v_recv > v_item.quantity_dispatched THEN
      RAISE EXCEPTION 'Cannot receive more than dispatched (% > %)', v_recv, v_item.quantity_dispatched;
    END IF;
    UPDATE public.transfer_items
      SET quantity_received = v_recv, condition = v_cond
      WHERE id = v_item.id;
    IF v_recv <> v_item.quantity_dispatched OR v_cond <> 'good' THEN
      v_mismatch := TRUE;
    END IF;
  END LOOP;

  IF v_mismatch THEN
    IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
      RAISE EXCEPTION 'A discrepancy reason is required';
    END IF;
    UPDATE public.transfer_orders
      SET discrepancy_status = 'open', discrepancy_reason = p_reason, discrepancy_photos = p_photos
      WHERE id = p_transfer_id;
  END IF;

  -- Setting status='received' fires the inventory-add trigger and authority guard.
  UPDATE public.transfer_orders
    SET status = 'received', received_by = auth.uid(), received_at = now(), actual_delivery_at = now()
    WHERE id = p_transfer_id;

  -- Notify creator of receipt.
  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  VALUES (t.created_by, 'transfer_received', 'Transfer received',
          format('Transfer %s was received.', t.transfer_number), 'transfer_order', p_transfer_id);

  -- Notify source officers of receipt.
  FOR v_uid IN
    SELECT DISTINCT uw.user_id FROM public.user_warehouses uw
    JOIN public.profiles p ON p.id = uw.user_id
    WHERE uw.warehouse_id = t.source_warehouse_id
      AND p.role IN ('district_officer','field_officer') AND p.is_active
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
    VALUES (v_uid, 'transfer_received', 'Transfer received',
            format('Transfer %s was received at destination.', t.transfer_number), 'transfer_order', p_transfer_id);
  END LOOP;

  -- On discrepancy, notify source officers + HQ logistics.
  IF v_mismatch THEN
    FOR v_uid IN
      SELECT id FROM public.profiles WHERE role = 'hq_logistics' AND is_active
      UNION
      SELECT DISTINCT uw.user_id FROM public.user_warehouses uw
        JOIN public.profiles p ON p.id = uw.user_id
        WHERE uw.warehouse_id = t.source_warehouse_id
          AND p.role IN ('district_officer','field_officer') AND p.is_active
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
      VALUES (v_uid, 'discrepancy', 'Transfer discrepancy',
              format('Transfer %s received with a discrepancy: %s', t.transfer_number, p_reason),
              'transfer_order', p_transfer_id);
    END LOOP;
  END IF;
END;
$$;

-- 2) resolve_discrepancy: close an open discrepancy.
CREATE OR REPLACE FUNCTION public.resolve_discrepancy(p_transfer_id UUID, p_note TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.transfer_orders; v_role public.user_role := public.current_user_role();
BEGIN
  IF p_note IS NULL OR length(trim(p_note)) = 0 THEN RAISE EXCEPTION 'A resolution note is required'; END IF;
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.discrepancy_status <> 'open' THEN RAISE EXCEPTION 'No open discrepancy to resolve'; END IF;
  IF NOT (
    v_role IN ('hq_logistics','dg','sysadmin')
    OR (v_role IN ('district_officer','field_officer') AND public.user_has_warehouse(t.source_warehouse_id))
  ) THEN
    RAISE EXCEPTION 'Not authorized to resolve this discrepancy';
  END IF;

  UPDATE public.transfer_orders
    SET discrepancy_status = 'resolved', discrepancy_resolved_by = auth.uid(),
        discrepancy_resolved_at = now(), discrepancy_resolution_note = p_note
    WHERE id = p_transfer_id;

  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  SELECT u.uid, 'system', 'Discrepancy resolved',
         format('Discrepancy on transfer %s was resolved.', t.transfer_number), 'transfer_order', p_transfer_id
  FROM (
    SELECT t.received_by AS uid WHERE t.received_by IS NOT NULL
    UNION
    SELECT t.created_by
  ) u
  WHERE u.uid IS NOT NULL;
END;
$$;

-- 3) Refactor inventory trigger: keep dispatch + receipt inventory, drop the status='discrepancy' flip.
CREATE OR REPLACE FUNCTION public.process_transfer_dispatch_receipt()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    item RECORD;
    v_source_inventory_id UUID;
    v_dest_inventory_id UUID;
    v_source_qty INTEGER;
BEGIN
    -- On dispatch: deduct source stock, release reservation
    IF NEW.status = 'in_transit' AND OLD.status != 'in_transit' THEN
        FOR item IN SELECT * FROM public.transfer_items WHERE transfer_id = NEW.id LOOP
            SELECT id, quantity INTO v_source_inventory_id, v_source_qty
            FROM public.inventory
            WHERE warehouse_id = NEW.source_warehouse_id AND sku_id = item.sku_id AND batch_lot = item.batch_lot
            FOR UPDATE;

            IF v_source_inventory_id IS NULL OR v_source_qty < item.quantity_dispatched THEN
                RAISE EXCEPTION 'Insufficient stock to dispatch SKU %', item.sku_id;
            END IF;

            UPDATE public.inventory
            SET quantity = quantity - item.quantity_dispatched,
                reserved_quantity = reserved_quantity - item.quantity_dispatched
            WHERE id = v_source_inventory_id;

            INSERT INTO public.inventory_transactions (
                warehouse_id, sku_id, batch_lot, transaction_type,
                quantity_change, quantity_after, reference_type, reference_id, performed_by
            ) VALUES (
                NEW.source_warehouse_id, item.sku_id, item.batch_lot, 'transfer_out',
                -item.quantity_dispatched,
                (SELECT quantity FROM public.inventory WHERE id = v_source_inventory_id),
                'transfer_order', NEW.id, auth.uid()
            );
        END LOOP;
    END IF;

    -- On receipt: add destination stock (all received quantity, any condition)
    IF NEW.status = 'received' AND OLD.status != 'received' THEN
        FOR item IN SELECT * FROM public.transfer_items WHERE transfer_id = NEW.id LOOP
            SELECT id INTO v_dest_inventory_id
            FROM public.inventory
            WHERE warehouse_id = NEW.destination_warehouse_id AND sku_id = item.sku_id AND batch_lot = item.batch_lot
            FOR UPDATE;

            IF v_dest_inventory_id IS NULL THEN
                INSERT INTO public.inventory (
                    warehouse_id, sku_id, batch_lot, expiry_date, quantity, reserved_quantity, storage_location
                ) VALUES (
                    NEW.destination_warehouse_id,
                    item.sku_id,
                    item.batch_lot,
                    (SELECT expiry_date FROM public.inventory WHERE warehouse_id = NEW.source_warehouse_id AND sku_id = item.sku_id AND batch_lot = item.batch_lot LIMIT 1),
                    COALESCE(item.quantity_received, item.quantity_dispatched),
                    0,
                    'RECEIVED'
                )
                RETURNING id INTO v_dest_inventory_id;
            ELSE
                UPDATE public.inventory
                SET quantity = quantity + COALESCE(item.quantity_received, item.quantity_dispatched)
                WHERE id = v_dest_inventory_id;
            END IF;

            INSERT INTO public.inventory_transactions (
                warehouse_id, sku_id, batch_lot, transaction_type,
                quantity_change, quantity_after, reference_type, reference_id, performed_by
            ) VALUES (
                NEW.destination_warehouse_id, item.sku_id, item.batch_lot, 'transfer_in',
                COALESCE(item.quantity_received, item.quantity_dispatched),
                (SELECT quantity FROM public.inventory WHERE id = v_dest_inventory_id),
                'transfer_order', NEW.id, auth.uid()
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- 4) Extend the authority guard with a receipt clause.
CREATE OR REPLACE FUNCTION public.check_transfer_authority()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_role public.user_role := public.current_user_role();
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending_approval' THEN
    IF v_role IS NULL OR NOT public.is_approver_role(v_role)
       OR public.role_level(v_role) < OLD.required_level THEN
      RAISE EXCEPTION 'Not authorized to approve at level %', OLD.required_level;
    END IF;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending_approval' THEN
    IF v_role IS NULL OR NOT public.is_approver_role(v_role)
       OR public.role_level(v_role) < OLD.required_level THEN
      RAISE EXCEPTION 'Not authorized to reject at level %', OLD.required_level;
    END IF;
    IF NEW.rejection_reason IS NULL OR length(trim(NEW.rejection_reason)) = 0 THEN
      RAISE EXCEPTION 'Rejection reason is required';
    END IF;
  ELSIF NEW.status = 'received' AND OLD.status = 'in_transit' THEN
    IF v_role IS NULL OR NOT (
      v_role IN ('hq_logistics','dg','sysadmin')
      OR (v_role IN ('district_officer','field_officer') AND public.user_has_warehouse(NEW.destination_warehouse_id))
    ) THEN
      RAISE EXCEPTION 'Not authorized to receive at destination warehouse';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
```

- [ ] **Step 2: Apply and verify clean + discrepancy receipt**

Run:
```bash
cd nadmo-wms-app && supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -c "
DO \$\$
DECLARE
  v_src UUID; v_dst UUID; v_sku UUID; v_batch TEXT; v_qty INT; v_t UUID; v_item UUID;
  v_dest_before INT; v_dest_after INT; v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM public.profiles WHERE role='sysadmin' LIMIT 1;
  SELECT warehouse_id, sku_id, batch_lot, quantity INTO v_src, v_sku, v_batch, v_qty
    FROM public.inventory WHERE quantity > 10 LIMIT 1;
  SELECT id INTO v_dst FROM public.warehouses WHERE id <> v_src LIMIT 1;
  INSERT INTO public.transfer_orders (source_warehouse_id, destination_warehouse_id, created_by, priority, status)
    VALUES (v_src, v_dst, v_uid, 'routine', 'draft') RETURNING id INTO v_t;
  INSERT INTO public.transfer_items (transfer_id, sku_id, batch_lot, quantity_dispatched)
    VALUES (v_t, v_sku, v_batch, 5) RETURNING id INTO v_item;
  PERFORM public.submit_transfer_for_approval(v_t);
  UPDATE public.transfer_orders SET status='approved' WHERE id=v_t;       -- reserve trigger
  UPDATE public.transfer_orders SET status='in_transit' WHERE id=v_t;     -- dispatch trigger
  SELECT COALESCE(SUM(quantity),0) INTO v_dest_before FROM public.inventory
    WHERE warehouse_id=v_dst AND sku_id=v_sku AND batch_lot=v_batch;
  -- short receipt (3 of 5) -> discrepancy
  PERFORM public.receive_transfer(v_t,
    jsonb_build_array(jsonb_build_object('item_id', v_item, 'quantity_received', 3, 'condition', 'good')),
    'short by 2', NULL);
  SELECT COALESCE(SUM(quantity),0) INTO v_dest_after FROM public.inventory
    WHERE warehouse_id=v_dst AND sku_id=v_sku AND batch_lot=v_batch;
  RAISE NOTICE 'status=% discrepancy=% dest_delta=% (expect received, open, 3)',
    (SELECT status FROM public.transfer_orders WHERE id=v_t),
    (SELECT discrepancy_status FROM public.transfer_orders WHERE id=v_t),
    v_dest_after - v_dest_before;
  PERFORM public.resolve_discrepancy(v_t, 'confirmed loss in transit');
  RAISE NOTICE 'after resolve discrepancy=% (expect resolved)',
    (SELECT discrepancy_status FROM public.transfer_orders WHERE id=v_t);
END \$\$;"
```
Expected NOTICEs: `status=received discrepancy=open dest_delta=3`; `after resolve discrepancy=resolved`.

- [ ] **Step 3: Verify over-receipt is blocked**

Run (expects an error):
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
DO \$\$
DECLARE v_src UUID; v_dst UUID; v_sku UUID; v_batch TEXT; v_t UUID; v_item UUID; v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM public.profiles WHERE role='sysadmin' LIMIT 1;
  SELECT warehouse_id, sku_id, batch_lot INTO v_src, v_sku, v_batch FROM public.inventory WHERE quantity > 10 LIMIT 1;
  SELECT id INTO v_dst FROM public.warehouses WHERE id <> v_src LIMIT 1;
  INSERT INTO public.transfer_orders (source_warehouse_id, destination_warehouse_id, created_by, priority, status)
    VALUES (v_src, v_dst, v_uid, 'routine', 'draft') RETURNING id INTO v_t;
  INSERT INTO public.transfer_items (transfer_id, sku_id, batch_lot, quantity_dispatched)
    VALUES (v_t, v_sku, v_batch, 5) RETURNING id INTO v_item;
  PERFORM public.submit_transfer_for_approval(v_t);
  UPDATE public.transfer_orders SET status='approved' WHERE id=v_t;
  UPDATE public.transfer_orders SET status='in_transit' WHERE id=v_t;
  PERFORM public.receive_transfer(v_t,
    jsonb_build_array(jsonb_build_object('item_id', v_item, 'quantity_received', 9, 'condition', 'good')), NULL, NULL);
END \$\$;"
```
Expected: `ERROR: Cannot receive more than dispatched (9 > 5)`.

- [ ] **Step 4: Commit**

```bash
git add nadmo-wms-app/supabase/migrations/00020_receipt_workflow.sql
git commit -m "feat(db): receipt + discrepancy RPCs, inventory trigger refactor, receive guard"
```

---

### Task 4: Migration — RLS grants (`00021`)

**Files:**
- Create: `nadmo-wms-app/supabase/migrations/00021_receipt_rls_grants.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Migration: grant execute on receipt RPCs to authenticated callers
GRANT EXECUTE ON FUNCTION public.receive_transfer(UUID, JSONB, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_discrepancy(UUID, TEXT) TO authenticated;
```

- [ ] **Step 2: Apply and verify**

Run:
```bash
cd nadmo-wms-app && supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
  SELECT has_function_privilege('authenticated', 'public.receive_transfer(uuid,jsonb,text,text[])', 'EXECUTE') AS recv,
         has_function_privilege('authenticated', 'public.resolve_discrepancy(uuid,text)', 'EXECUTE') AS resolve;"
```
Expected: `recv = t`, `resolve = t`.

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/supabase/migrations/00021_receipt_rls_grants.sql
git commit -m "feat(db): grant execute on receipt RPCs"
```

---

### Task 5: Server actions for receipt + resolution

**Files:**
- Modify: `nadmo-wms-app/app/(dashboard)/transfers/[id]/actions.ts`

**Interfaces:**
- Consumes RPCs from Task 3.
- Produces: `ReceiveLine` type; `receiveTransfer(id, lines, reason, photos?)`, `resolveDiscrepancy(id, note)`.

- [ ] **Step 1: Append the actions**

Add to `nadmo-wms-app/app/(dashboard)/transfers/[id]/actions.ts`:

```typescript
export interface ReceiveLine {
  item_id: string;
  quantity_received: number;
  condition: 'good' | 'damaged' | 'expired' | 'missing';
}

export async function receiveTransfer(
  id: string,
  lines: ReceiveLine[],
  reason: string,
  photos: string[] = []
): Promise<ActionResult> {
  return callRpc(id, 'receive_transfer', {
    p_transfer_id: id,
    p_lines: lines,
    p_reason: reason.trim() || null,
    p_photos: photos.length ? photos : null,
  });
}

export async function resolveDiscrepancy(id: string, note: string): Promise<ActionResult> {
  if (!note.trim()) return { ok: false, error: 'A resolution note is required.' };
  return callRpc(id, 'resolve_discrepancy', { p_transfer_id: id, p_note: note.trim() });
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd nadmo-wms-app && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "nadmo-wms-app/app/(dashboard)/transfers/[id]/actions.ts"
git commit -m "feat(transfers): server actions for receive and resolve-discrepancy"
```

---

### Task 6: Receipt + resolution UI (`transfer-actions.tsx`)

**Files:**
- Modify: `nadmo-wms-app/components/transfers/transfer-actions.tsx`

**Interfaces:**
- Consumes: `receiveTransfer`, `resolveDiscrepancy`, `ReceiveLine` (Task 5); `canReceiveTransfer`, `canResolveDiscrepancy` (Task 1); existing `runAction` helper (from the approval-chain work).

- [ ] **Step 1: Update imports**

In `nadmo-wms-app/components/transfers/transfer-actions.tsx`:

Add to the auth import line:

```typescript
import { canApproveAtLevel, nextRung, ROLE_LABELS, canReceiveTransfer, canResolveDiscrepancy } from '@/lib/auth';
```

Add to the actions import block:

```typescript
import {
  approveTransfer,
  rejectTransfer,
  escalateTransfer,
  resubmitTransfer,
  cancelTransfer,
  receiveTransfer,
  resolveDiscrepancy,
  type ReceiveLine,
} from '@/app/(dashboard)/transfers/[id]/actions';
```

Add the Select import (next to the other ui imports):

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

- [ ] **Step 2: Add receipt + resolution state**

Next to the existing `receivedQuantities` state, add:

```typescript
  const [conditions, setConditions] = useState<Record<string, string>>({});
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [resolveNote, setResolveNote] = useState('');
```

- [ ] **Step 3: Replace `handleReceive` with the RPC version**

Replace the entire existing `handleReceive` function with:

```typescript
  function lineFor(item: TransferItem): ReceiveLine {
    const qtyStr = receivedQuantities[item.id];
    const quantity_received = qtyStr === undefined || qtyStr === '' ? item.quantity_dispatched : parseInt(qtyStr, 10);
    const condition = (conditions[item.id] || 'good') as ReceiveLine['condition'];
    return { item_id: item.id, quantity_received, condition };
  }

  const receiptHasMismatch = items.some((item) => {
    const l = lineFor(item);
    return l.quantity_received !== item.quantity_dispatched || l.condition !== 'good';
  });

  async function handleReceive() {
    const lines = items.map(lineFor);
    if (lines.some((l) => l.quantity_received > items.find((i) => i.id === l.item_id)!.quantity_dispatched)) {
      toast.error('Received quantity cannot exceed dispatched');
      return;
    }
    if (receiptHasMismatch && !discrepancyReason.trim()) {
      toast.error('A discrepancy reason is required');
      return;
    }
    await runAction(
      () => receiveTransfer(transfer.id, lines, discrepancyReason),
      receiptHasMismatch ? 'Received with discrepancy' : 'Transfer received'
    );
  }
```

- [ ] **Step 4: Replace the `in_transit` branch**

Replace the whole `if (transfer.status === 'in_transit') { ... }` block with:

```typescript
  if (transfer.status === 'in_transit') {
    if (!canReceiveTransfer(role)) {
      return (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Awaiting receipt by destination warehouse staff.</p>
        </Card>
      );
    }
    return (
      <Card className="p-4">
        <h3 className="font-medium mb-4">Confirm Receipt</h3>
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="text-sm">
                {item.sku?.name}{' '}
                <span className="text-muted-foreground">(dispatched {item.quantity_dispatched})</span>
              </div>
              <Input
                type="number"
                min="0"
                max={item.quantity_dispatched}
                placeholder="Received quantity"
                value={receivedQuantities[item.id] ?? ''}
                onChange={(e) =>
                  setReceivedQuantities({ ...receivedQuantities, [item.id]: e.target.value })
                }
              />
              <Select
                value={conditions[item.id] || 'good'}
                onValueChange={(value) => setConditions({ ...conditions, [item.id]: value || 'good' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        {receiptHasMismatch && (
          <div className="space-y-2 mb-4">
            <Label>Discrepancy reason (required)</Label>
            <Input
              value={discrepancyReason}
              onChange={(e) => setDiscrepancyReason(e.target.value)}
              placeholder="Explain the shortfall or damage"
            />
          </div>
        )}
        <Button onClick={handleReceive} disabled={loading} className="bg-[#10B981] hover:bg-[#059669]">
          Confirm Receipt
        </Button>
      </Card>
    );
  }

  if (transfer.discrepancy_status === 'open') {
    return (
      <Card className="p-4 space-y-3">
        <div>
          <h3 className="font-medium">Discrepancy reported</h3>
          {transfer.discrepancy_reason && (
            <p className="text-sm text-muted-foreground">Reason: {transfer.discrepancy_reason}</p>
          )}
        </div>
        {canResolveDiscrepancy(role) ? (
          <div className="space-y-2">
            <Label>Resolution note (required)</Label>
            <Input
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="How was this resolved?"
            />
            <Button
              disabled={loading || !resolveNote.trim()}
              className="bg-[#006B3F] hover:bg-[#024F2E]"
              onClick={() => runAction(() => resolveDiscrepancy(transfer.id, resolveNote), 'Discrepancy resolved')}
            >
              Resolve Discrepancy
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Pending resolution by HQ or the source warehouse.</p>
        )}
      </Card>
    );
  }
```

- [ ] **Step 5: Verify it type-checks**

Run: `cd nadmo-wms-app && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add nadmo-wms-app/components/transfers/transfer-actions.tsx
git commit -m "feat(transfers): receipt with condition/discrepancy and resolution UI"
```

---

### Task 7: Discrepancy badge in the list

**Files:**
- Modify: `nadmo-wms-app/components/transfers/transfer-list.tsx`

- [ ] **Step 1: Add the badge**

In `nadmo-wms-app/components/transfers/transfer-list.tsx`, inside the Status `<TableCell>` `div` (added in the approval-chain work), add after the overdue badge:

```tsx
                  {transfer.discrepancy_status === 'open' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      Discrepancy
                    </span>
                  )}
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd nadmo-wms-app && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/components/transfers/transfer-list.tsx
git commit -m "feat(transfers): discrepancy badge in list"
```

---

### Task 8: Test + lint + build gate

**Files:** none (verification only).

- [ ] **Step 1: Run the test suite**

Run: `cd nadmo-wms-app && npm run test`
Expected: all pass.

- [ ] **Step 2: Lint and build**

Run: `cd nadmo-wms-app && npm run lint; npm run build`
Expected: build compiles + type-checks. (Note: a pre-existing `react-hooks/set-state-in-effect` lint error in `transfer-form.tsx:55`, and a `/login` prerender failure when `.env.local` Supabase keys are absent, are unrelated to this work — do not "fix" them here.)

- [ ] **Step 3: Commit any lint fixes for files this plan touched**

```bash
git add -A
git commit -m "chore(transfers): lint fixes for receipt flow" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:**
- Authorization (destination staff only + HQ override) → `receive_transfer` (T3) + guard clause (T3) + `canReceiveTransfer` UI gate (T1/T6). ✓
- Condition quantity-only, all received qty to available → trigger refactor keeps `COALESCE(quantity_received, dispatched)` add, no condition branching (T3). ✓
- Discrepancy decoupled from status; reason required; notify source+HQ; resolution; block over-receipt → `receive_transfer` + `resolve_discrepancy` (T3), `discrepancy_status` column (T2). ✓
- PoD = received_by/received_at only → `receive_transfer` sets these; no signature captured. ✓
- Data model (enum + columns, reuse condition/quantity_received) → T2; types T1. ✓
- Server actions → T5. UI receive + resolve + list badge → T6/T7. ✓
- Tests (helpers + SQL assertions) → T1 + T3 verification steps. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `ReceiveLine` defined in T5, consumed in T6 with matching fields (`item_id`, `quantity_received`, `condition`). `discrepancy_status` values (`none|open|resolved`) consistent across T1 type, T2 enum, T3 RPCs, T6/T7 UI. RPC names/args (`receive_transfer(uuid,jsonb,text,text[])`, `resolve_discrepancy(uuid,text)`) match between T3, T4 grants, and T5 callers. Reuses existing `runAction` from transfer-actions (introduced by the approval-chain work — present in the current file). ✓
