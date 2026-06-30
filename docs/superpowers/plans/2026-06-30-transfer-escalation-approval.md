# Transfer Escalation & Approval Chain — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a NADMO command-chain approval workflow to inter-warehouse transfers with a single authority gate that escalates up the chain on emergency priority, stock-risk, SLA timeout, or manual action, plus a rejection-and-resubmit path — all enforced in Postgres.

**Architecture:** A transfer's current authority gate is a `required_level` (role-hierarchy number) on `transfer_orders`. Routing is computed by SECURITY DEFINER RPCs (`submit_transfer_for_approval`, `approve_transfer`, `reject_transfer`, `escalate_transfer`, `cancel_transfer`, `escalate_overdue_approvals`) so every entry point shares one code path; a `BEFORE UPDATE` trigger is the authority backstop. Every rung is recorded in a new `transfer_approval_steps` table that drives the timeline UI. `pg_cron` runs the SLA sweep. Thin Next.js server actions wrap the RPCs; pure eligibility helpers in `lib/auth.ts` drive the UI and are unit-tested with vitest.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (Postgres + pg_cron + Edge Functions), vitest.

## Global Constraints

- Approver ladder (role → hierarchy level, from `lib/auth.ts` `ROLE_HIERARCHY`): `district_officer`=2, `regional_manager`=3, `hq_logistics`=5, `dg`=8. `sysadmin`=9 always clears. `auditor`=7 is oversight only and is NOT an approver despite its number.
- Scale → starting required level: `routine`→2, `standard`→3, `large`→5, `strategic`→8 (preserves existing `canApproveTransfer`).
- `next_rung`: 2→3→5→8→8 (capped at dg). Escalation only ever raises the level.
- SLA windows by priority: `emergency`=1h, `urgent`=4h, `routine`=24h.
- Stock-risk floor = `hq_logistics` (level 5). Emergency start-high = exactly one rung above the scale tier.
- Migrations are append-only; next free numbers are `00014`–`00018`. Enum `ADD VALUE` must be in its own migration, committed before use.
- Existing triggers `reserve_stock_on_approval` (on `→approved`) and `process_transfer_stock` must keep working unchanged.
- DB authority is the source of truth; client `canApprove*` checks are UX only.
- Local DB connection for verification: `postgresql://postgres:postgres@127.0.0.1:54322/postgres` (after `supabase start`). There is no SQL unit-test harness in this repo; SQL tasks are verified by applying migrations and running assertion `SELECT`s.

---

### Task 1: Pure approval-eligibility helpers (`lib/auth.ts`)

**Files:**
- Modify: `nadmo-wms-app/lib/auth.ts`
- Test: `nadmo-wms-app/lib/auth.test.ts`

**Interfaces:**
- Consumes: existing `ROLE_HIERARCHY`, `UserRole`.
- Produces:
  - `APPROVER_LADDER: UserRole[]` = `['district_officer','regional_manager','hq_logistics','dg']`
  - `requiredLevelForScale(scale: TransferOrder['scale']): number`
  - `nextRung(level: number): number`
  - `isApproverRole(role: UserRole): boolean`
  - `canApproveAtLevel(role: UserRole, requiredLevel: number): boolean`
  - `canRejectAtLevel(role: UserRole, requiredLevel: number): boolean` (alias of approve eligibility)
  - `canEscalateAtLevel(role: UserRole, requiredLevel: number): boolean` (alias of approve eligibility)

- [ ] **Step 1: Write the failing tests**

Append to `nadmo-wms-app/lib/auth.test.ts`:

```typescript
import {
  APPROVER_LADDER,
  requiredLevelForScale,
  nextRung,
  isApproverRole,
  canApproveAtLevel,
  canRejectAtLevel,
  canEscalateAtLevel,
} from './auth';

describe('approval chain helpers', () => {
  it('maps scale to its starting required level', () => {
    expect(requiredLevelForScale('routine')).toBe(2);
    expect(requiredLevelForScale('standard')).toBe(3);
    expect(requiredLevelForScale('large')).toBe(5);
    expect(requiredLevelForScale('strategic')).toBe(8);
  });

  it('escalates one rung up the ladder, capped at dg(8)', () => {
    expect(nextRung(2)).toBe(3);
    expect(nextRung(3)).toBe(5);
    expect(nextRung(5)).toBe(8);
    expect(nextRung(8)).toBe(8);
    // a non-ladder level rounds up to the next ladder rung
    expect(nextRung(4)).toBe(5);
  });

  it('identifies approver roles (ladder + sysadmin only)', () => {
    expect(APPROVER_LADDER).toEqual(['district_officer', 'regional_manager', 'hq_logistics', 'dg']);
    expect(isApproverRole('district_officer')).toBe(true);
    expect(isApproverRole('sysadmin')).toBe(true);
    expect(isApproverRole('auditor')).toBe(false);
    expect(isApproverRole('hq_admin')).toBe(false);
    expect(isApproverRole('hq_procurement')).toBe(false);
  });

  it('gates approval by ladder membership AND level', () => {
    expect(canApproveAtLevel('district_officer', 2)).toBe(true);
    expect(canApproveAtLevel('district_officer', 3)).toBe(false);
    expect(canApproveAtLevel('regional_manager', 3)).toBe(true);
    expect(canApproveAtLevel('hq_logistics', 5)).toBe(true);
    expect(canApproveAtLevel('dg', 8)).toBe(true);
    expect(canApproveAtLevel('sysadmin', 8)).toBe(true);
    // auditor outranks hq_logistics numerically but is not an approver
    expect(canApproveAtLevel('auditor', 5)).toBe(false);
    expect(canRejectAtLevel('regional_manager', 3)).toBe(true);
    expect(canEscalateAtLevel('district_officer', 2)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd nadmo-wms-app && npm run test -- auth`
Expected: FAIL — `APPROVER_LADDER` / `requiredLevelForScale` not exported.

- [ ] **Step 3: Implement the helpers**

Append to `nadmo-wms-app/lib/auth.ts`:

```typescript
/** Roles that may approve, lowest to highest authority. sysadmin clears any gate separately. */
export const APPROVER_LADDER: UserRole[] = [
  'district_officer',
  'regional_manager',
  'hq_logistics',
  'dg',
];

const SCALE_REQUIRED_ROLE: Record<TransferScale, UserRole> = {
  routine: 'district_officer',
  standard: 'regional_manager',
  large: 'hq_logistics',
  strategic: 'dg',
};

/** Starting authority level for a transfer of the given scale. */
export function requiredLevelForScale(scale: TransferScale): number {
  return ROLE_HIERARCHY[SCALE_REQUIRED_ROLE[scale]];
}

/** Next ladder rung strictly above `level`, capped at dg(8). */
export function nextRung(level: number): number {
  const ladderLevels = APPROVER_LADDER.map((r) => ROLE_HIERARCHY[r]);
  return ladderLevels.find((l) => l > level) ?? ROLE_HIERARCHY.dg;
}

/** Whether the role is an approver tier (ladder member or sysadmin). */
export function isApproverRole(role: UserRole): boolean {
  return role === 'sysadmin' || APPROVER_LADDER.includes(role);
}

/** Whether the role may clear a gate currently set to `requiredLevel`. */
export function canApproveAtLevel(role: UserRole, requiredLevel: number): boolean {
  if (role === 'sysadmin') return true;
  return isApproverRole(role) && ROLE_HIERARCHY[role] >= requiredLevel;
}

export const canRejectAtLevel = canApproveAtLevel;
export const canEscalateAtLevel = canApproveAtLevel;
```

Add the `TransferScale` import at the top of `lib/auth.ts` (next to the existing `UserRole` import):

```typescript
import { UserRole, TransferScale } from '@/types';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd nadmo-wms-app && npm run test -- auth`
Expected: PASS (existing + new tests).

- [ ] **Step 5: Commit**

```bash
git add nadmo-wms-app/lib/auth.ts nadmo-wms-app/lib/auth.test.ts
git commit -m "feat(auth): approval-chain eligibility helpers"
```

---

### Task 2: TypeScript types (`types/index.ts`)

**Files:**
- Modify: `nadmo-wms-app/types/index.ts`

**Interfaces:**
- Consumes: existing `UserRole`, `Profile`.
- Produces: exported `TransferScale`, `ApprovalAction`, `TransferApprovalStep`; `'rejected'` added to `TransferStatus`; new `transfer_orders` columns on `TransferOrder`.

- [ ] **Step 1: Add the new type members**

In `nadmo-wms-app/types/index.ts`:

1. Add `'rejected'` to the `TransferStatus` union (after `'discrepancy'`):

```typescript
export type TransferStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'ready_for_dispatch'
  | 'in_transit'
  | 'received'
  | 'discrepancy'
  | 'rejected'
  | 'cancelled'
  | 'overdue';
```

2. Extract the scale union into a reusable type and use it on `TransferOrder`:

```typescript
export type TransferScale = 'routine' | 'standard' | 'large' | 'strategic';

export type ApprovalAction = 'pending' | 'approved' | 'rejected' | 'escalated' | 'returned';

export interface TransferApprovalStep {
  id: string;
  transfer_id: string;
  step_number: number;
  required_level: number;
  action: ApprovalAction;
  actor_id: string | null;
  actor_role: UserRole | null;
  reason: string | null;
  sla_due_at: string | null;
  created_at: string;
  resolved_at: string | null;
  actor?: Profile;
}
```

3. In `interface TransferOrder`, change `scale: 'routine' | 'standard' | 'large' | 'strategic';` to `scale: TransferScale;` and add these fields after `approved_at`:

```typescript
  required_level: number | null;
  sla_due_at: string | null;
  escalation_count: number;
  submitted_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  approval_steps?: TransferApprovalStep[];
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd nadmo-wms-app && npx tsc --noEmit`
Expected: no new errors from `types/index.ts` (Task 1 already imports `TransferScale`).

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/types/index.ts
git commit -m "feat(types): approval-chain fields and TransferApprovalStep"
```

---

### Task 3: Migration — add `rejected` transfer status (`00014`)

**Files:**
- Create: `nadmo-wms-app/supabase/migrations/00014_transfer_status_rejected.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Migration: add 'rejected' value to transfer_status enum.
-- Must be its own migration: a new enum value cannot be used in the same
-- transaction that adds it.
ALTER TYPE public.transfer_status ADD VALUE IF NOT EXISTS 'rejected';
```

- [ ] **Step 2: Apply and verify**

Run:
```bash
cd nadmo-wms-app && supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT 'rejected' = ANY(enum_range(NULL::public.transfer_status)::text[]) AS ok;"
```
Expected: `ok` is `t`.

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/supabase/migrations/00014_transfer_status_rejected.sql
git commit -m "feat(db): add rejected transfer status"
```

---

### Task 4: Migration — approval-chain schema (`00015`)

**Files:**
- Create: `nadmo-wms-app/supabase/migrations/00015_approval_chain_schema.sql`

**Interfaces:**
- Produces tables `public.transfer_approval_steps`, `public.approval_sla_config`; enum `public.approval_action`; new columns on `public.transfer_orders`.

- [ ] **Step 1: Write the migration**

```sql
-- Migration: approval-chain schema (columns, steps table, SLA config)

ALTER TABLE public.transfer_orders
  ADD COLUMN IF NOT EXISTS required_level   SMALLINT,
  ADD COLUMN IF NOT EXISTS sla_due_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_count SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS submitted_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by      UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS rejected_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE TYPE public.approval_action AS ENUM (
  'pending', 'approved', 'rejected', 'escalated', 'returned'
);

CREATE TABLE IF NOT EXISTS public.transfer_approval_steps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id    UUID NOT NULL REFERENCES public.transfer_orders(id) ON DELETE CASCADE,
  step_number    INTEGER NOT NULL,
  required_level SMALLINT NOT NULL,
  action         public.approval_action NOT NULL DEFAULT 'pending',
  actor_id       UUID REFERENCES public.profiles(id),
  actor_role     public.user_role,
  reason         TEXT,
  sla_due_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ,
  UNIQUE (transfer_id, step_number)
);
COMMENT ON TABLE public.transfer_approval_steps IS 'Command-chain audit: one row per authority rung a transfer occupies';

CREATE INDEX IF NOT EXISTS idx_approval_steps_transfer ON public.transfer_approval_steps(transfer_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_open
  ON public.transfer_approval_steps(transfer_id) WHERE action = 'pending';

CREATE TABLE IF NOT EXISTS public.approval_sla_config (
  priority     public.transfer_priority PRIMARY KEY,
  window_hours NUMERIC NOT NULL CHECK (window_hours > 0)
);

INSERT INTO public.approval_sla_config (priority, window_hours) VALUES
  ('emergency', 1),
  ('urgent', 4),
  ('routine', 24)
ON CONFLICT (priority) DO NOTHING;
```

- [ ] **Step 2: Apply and verify**

Run:
```bash
cd nadmo-wms-app && supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\d public.transfer_approval_steps"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT count(*) AS sla_rows FROM public.approval_sla_config;"
```
Expected: table prints with the columns above; `sla_rows` = 3.

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/supabase/migrations/00015_approval_chain_schema.sql
git commit -m "feat(db): approval-chain schema"
```

---

### Task 5: Migration — helper functions (`00016`)

**Files:**
- Create: `nadmo-wms-app/supabase/migrations/00016_approval_chain_helpers.sql`

**Interfaces:**
- Produces SQL helpers: `role_level(user_role)→smallint`, `is_approver_role(user_role)→boolean`, `scale_required_level(transfer_scale)→smallint`, `next_rung(smallint)→smallint`, `role_for_level(smallint)→user_role`, `sla_interval(transfer_priority)→interval`, `would_breach_stock(uuid)→boolean`, `notify_approval_tier(uuid, smallint, notification_type, varchar, text)→void`.

- [ ] **Step 1: Write the migration**

```sql
-- Migration: approval-chain helper functions

-- Role → hierarchy level (mirror of ROLE_HIERARCHY in lib/auth.ts)
CREATE OR REPLACE FUNCTION public.role_level(p_role public.user_role)
RETURNS SMALLINT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_role
    WHEN 'readonly' THEN 0
    WHEN 'field_officer' THEN 1
    WHEN 'district_officer' THEN 2
    WHEN 'regional_manager' THEN 3
    WHEN 'hq_procurement' THEN 4
    WHEN 'hq_logistics' THEN 5
    WHEN 'hq_admin' THEN 6
    WHEN 'auditor' THEN 7
    WHEN 'dg' THEN 8
    WHEN 'sysadmin' THEN 9
  END::SMALLINT;
$$;

-- Approver tiers = ladder roles + sysadmin
CREATE OR REPLACE FUNCTION public.is_approver_role(p_role public.user_role)
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE AS $$
  SELECT p_role IN ('district_officer','regional_manager','hq_logistics','dg','sysadmin');
$$;

CREATE OR REPLACE FUNCTION public.scale_required_level(p_scale public.transfer_scale)
RETURNS SMALLINT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_scale
    WHEN 'routine' THEN 2
    WHEN 'standard' THEN 3
    WHEN 'large' THEN 5
    WHEN 'strategic' THEN 8
  END::SMALLINT;
$$;

-- Next ladder rung strictly above p_level, capped at dg(8)
CREATE OR REPLACE FUNCTION public.next_rung(p_level SMALLINT)
RETURNS SMALLINT LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
    (SELECT l FROM (VALUES (2::SMALLINT),(3),(5),(8)) AS rungs(l) WHERE l > p_level ORDER BY l LIMIT 1),
    8::SMALLINT
  );
$$;

-- Ladder level → the role that sits on that rung
CREATE OR REPLACE FUNCTION public.role_for_level(p_level SMALLINT)
RETURNS public.user_role LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_level
    WHEN 2 THEN 'district_officer'
    WHEN 3 THEN 'regional_manager'
    WHEN 5 THEN 'hq_logistics'
    WHEN 8 THEN 'dg'
  END::public.user_role;
$$;

CREATE OR REPLACE FUNCTION public.sla_interval(p_priority public.transfer_priority)
RETURNS INTERVAL LANGUAGE sql STABLE AS $$
  SELECT (COALESCE(
    (SELECT window_hours FROM public.approval_sla_config WHERE priority = p_priority),
    24
  ) || ' hours')::INTERVAL;
$$;

-- True if approving would drop any source line at/below its applicable min threshold
CREATE OR REPLACE FUNCTION public.would_breach_stock(p_transfer_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.transfer_items ti
    JOIN public.transfer_orders t ON t.id = ti.transfer_id
    JOIN public.skus s ON s.id = ti.sku_id
    JOIN public.inventory inv
      ON inv.warehouse_id = t.source_warehouse_id
     AND inv.sku_id = ti.sku_id
     AND inv.batch_lot = ti.batch_lot
    LEFT JOIN LATERAL (
      SELECT wt.min_quantity
      FROM public.warehouse_thresholds wt
      WHERE wt.sku_category_id = s.category_id
        AND (wt.warehouse_id = t.source_warehouse_id
             OR (wt.warehouse_id IS NULL AND wt.region_id IS NULL))
      ORDER BY CASE WHEN wt.warehouse_id IS NOT NULL THEN 0 ELSE 1 END
      LIMIT 1
    ) thr ON TRUE
    WHERE ti.transfer_id = p_transfer_id
      AND thr.min_quantity IS NOT NULL
      AND (inv.available_quantity - ti.quantity_dispatched) <= thr.min_quantity
  );
$$;

-- Notify every active user holding the role on rung p_level, scoped to the
-- transfer's source warehouse/region where the role is geographic.
CREATE OR REPLACE FUNCTION public.notify_approval_tier(
  p_transfer_id UUID,
  p_level SMALLINT,
  p_type public.notification_type,
  p_title VARCHAR(200),
  p_message TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.user_role := public.role_for_level(p_level);
  v_source UUID;
  v_region UUID;
  v_uid UUID;
BEGIN
  SELECT source_warehouse_id INTO v_source FROM public.transfer_orders WHERE id = p_transfer_id;
  SELECT d.region_id INTO v_region
  FROM public.warehouses w JOIN public.districts d ON d.id = w.district_id
  WHERE w.id = v_source;

  FOR v_uid IN
    SELECT DISTINCT p.id
    FROM public.profiles p
    LEFT JOIN public.user_warehouses uw ON uw.user_id = p.id
    LEFT JOIN public.warehouses w ON w.id = uw.warehouse_id
    LEFT JOIN public.districts d ON d.id = w.district_id
    WHERE p.role = v_role
      AND p.is_active
      AND (
        v_role IN ('hq_logistics','dg')          -- national roles: notify all
        OR (v_role = 'district_officer' AND uw.warehouse_id = v_source)
        OR (v_role = 'regional_manager' AND d.region_id = v_region)
      )
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
    VALUES (v_uid, p_type, p_title, p_message, 'transfer_order', p_transfer_id);
  END LOOP;
END;
$$;
```

- [ ] **Step 2: Apply and verify**

Run:
```bash
cd nadmo-wms-app && supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
  SELECT public.role_level('dg') AS dg,
         public.next_rung(2::smallint) AS r2,
         public.next_rung(8::smallint) AS r8,
         public.is_approver_role('auditor') AS auditor_appr,
         public.scale_required_level('large') AS large,
         public.role_for_level(5::smallint) AS rung5,
         EXTRACT(EPOCH FROM public.sla_interval('emergency'))/3600 AS emerg_h;"
```
Expected: `dg=8, r2=3, r8=8, auditor_appr=f, large=5, rung5=hq_logistics, emerg_h=1`.

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/supabase/migrations/00016_approval_chain_helpers.sql
git commit -m "feat(db): approval-chain helper functions"
```

---

### Task 6: Migration — workflow RPCs + authority guard (`00017`)

**Files:**
- Create: `nadmo-wms-app/supabase/migrations/00017_approval_chain_workflow.sql`

**Interfaces:**
- Consumes helpers from Task 5.
- Produces RPCs `submit_transfer_for_approval(uuid)`, `approve_transfer(uuid)`, `reject_transfer(uuid, text)`, `escalate_transfer(uuid, text)`, `cancel_transfer(uuid, text)`, `escalate_overdue_approvals()`; trigger `aa_check_transfer_authority`.

- [ ] **Step 1: Write the migration**

```sql
-- Migration: approval-chain workflow RPCs and authority guard

-- Submit (draft|rejected -> pending_approval): compute routing with items present.
CREATE OR REPLACE FUNCTION public.submit_transfer_for_approval(p_transfer_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.transfer_orders;
  v_scale public.transfer_scale;
  v_level SMALLINT;
  v_due TIMESTAMPTZ;
  v_step INT;
BEGIN
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Transfer % not found', p_transfer_id; END IF;
  IF t.status NOT IN ('draft','rejected') THEN
    RAISE EXCEPTION 'Transfer % cannot be submitted from status %', p_transfer_id, t.status;
  END IF;

  v_scale := public.determine_transfer_scale(p_transfer_id);
  v_level := public.scale_required_level(v_scale);
  IF t.priority = 'emergency' THEN
    v_level := public.next_rung(v_level);
  END IF;
  IF public.would_breach_stock(p_transfer_id) THEN
    v_level := GREATEST(v_level, 5::SMALLINT);
  END IF;
  v_due := now() + public.sla_interval(t.priority);

  UPDATE public.transfer_orders
  SET status = 'pending_approval', scale = v_scale, required_level = v_level,
      submitted_at = now(), sla_due_at = v_due, escalation_count = 0,
      rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL
  WHERE id = p_transfer_id;

  SELECT COALESCE(MAX(step_number),0)+1 INTO v_step
  FROM public.transfer_approval_steps WHERE transfer_id = p_transfer_id;

  INSERT INTO public.transfer_approval_steps (transfer_id, step_number, required_level, action, sla_due_at)
  VALUES (p_transfer_id, v_step, v_level, 'pending', v_due);

  PERFORM public.notify_approval_tier(p_transfer_id, v_level, 'approval_required',
    'Approval required',
    format('Transfer %s awaits %s approval.', t.transfer_number, public.role_for_level(v_level)));
END;
$$;

-- Approve: close the open step, set approved (existing reserve trigger then fires).
CREATE OR REPLACE FUNCTION public.approve_transfer(p_transfer_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.transfer_orders; v_role public.user_role := public.current_user_role();
BEGIN
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.status <> 'pending_approval' THEN RAISE EXCEPTION 'Transfer is not pending approval'; END IF;
  IF NOT public.is_approver_role(v_role) OR public.role_level(v_role) < t.required_level THEN
    RAISE EXCEPTION 'Insufficient authority to approve at level %', t.required_level;
  END IF;

  UPDATE public.transfer_orders
  SET status = 'approved', approved_by = auth.uid(), approved_at = now()
  WHERE id = p_transfer_id;

  UPDATE public.transfer_approval_steps
  SET action = 'approved', actor_id = auth.uid(), actor_role = v_role, resolved_at = now()
  WHERE transfer_id = p_transfer_id AND action = 'pending';

  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  VALUES (t.created_by, 'system', 'Transfer approved',
          format('Transfer %s was approved.', t.transfer_number), 'transfer_order', p_transfer_id);
END;
$$;

-- Reject: requires reason, returns to creator.
CREATE OR REPLACE FUNCTION public.reject_transfer(p_transfer_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.transfer_orders; v_role public.user_role := public.current_user_role();
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'Rejection reason is required'; END IF;
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.status <> 'pending_approval' THEN RAISE EXCEPTION 'Transfer is not pending approval'; END IF;
  IF NOT public.is_approver_role(v_role) OR public.role_level(v_role) < t.required_level THEN
    RAISE EXCEPTION 'Insufficient authority to reject at level %', t.required_level;
  END IF;

  UPDATE public.transfer_orders
  SET status = 'rejected', rejected_by = auth.uid(), rejected_at = now(), rejection_reason = p_reason
  WHERE id = p_transfer_id;

  UPDATE public.transfer_approval_steps
  SET action = 'rejected', actor_id = auth.uid(), actor_role = v_role, reason = p_reason, resolved_at = now()
  WHERE transfer_id = p_transfer_id AND action = 'pending';

  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  VALUES (t.created_by, 'system', 'Transfer rejected',
          format('Transfer %s was rejected: %s', t.transfer_number, p_reason), 'transfer_order', p_transfer_id);
END;
$$;

-- Manual escalation: current approver bumps one rung up.
CREATE OR REPLACE FUNCTION public.escalate_transfer(p_transfer_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.transfer_orders; v_role public.user_role := public.current_user_role();
  v_new SMALLINT; v_due TIMESTAMPTZ; v_step INT;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'Escalation reason is required'; END IF;
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.status <> 'pending_approval' THEN RAISE EXCEPTION 'Transfer is not pending approval'; END IF;
  IF NOT public.is_approver_role(v_role) OR public.role_level(v_role) < t.required_level THEN
    RAISE EXCEPTION 'Only the current approver may escalate'; END IF;
  v_new := public.next_rung(t.required_level);
  IF v_new = t.required_level THEN RAISE EXCEPTION 'Already at the top of the command chain'; END IF;
  v_due := now() + public.sla_interval(t.priority);

  UPDATE public.transfer_approval_steps
  SET action = 'escalated', actor_id = auth.uid(), actor_role = v_role, reason = p_reason, resolved_at = now()
  WHERE transfer_id = p_transfer_id AND action = 'pending';

  UPDATE public.transfer_orders
  SET required_level = v_new, escalation_count = escalation_count + 1, sla_due_at = v_due
  WHERE id = p_transfer_id;

  SELECT COALESCE(MAX(step_number),0)+1 INTO v_step
  FROM public.transfer_approval_steps WHERE transfer_id = p_transfer_id;
  INSERT INTO public.transfer_approval_steps (transfer_id, step_number, required_level, action, sla_due_at)
  VALUES (p_transfer_id, v_step, v_new, 'pending', v_due);

  PERFORM public.notify_approval_tier(p_transfer_id, v_new, 'approval_escalation',
    'Approval escalated',
    format('Transfer %s escalated to %s.', t.transfer_number, public.role_for_level(v_new)));
  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  VALUES (t.created_by, 'approval_escalation', 'Approval escalated',
          format('Transfer %s escalated to %s.', t.transfer_number, public.role_for_level(v_new)),
          'transfer_order', p_transfer_id);
END;
$$;

-- Cancel: creator or sysadmin/dg.
CREATE OR REPLACE FUNCTION public.cancel_transfer(p_transfer_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.transfer_orders; v_role public.user_role := public.current_user_role();
BEGIN
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.status IN ('in_transit','received','cancelled') THEN
    RAISE EXCEPTION 'Transfer % cannot be cancelled from status %', p_transfer_id, t.status; END IF;
  IF t.created_by <> auth.uid() AND v_role NOT IN ('dg','sysadmin') THEN
    RAISE EXCEPTION 'Not authorized to cancel this transfer'; END IF;

  UPDATE public.transfer_orders SET status = 'cancelled' WHERE id = p_transfer_id;
  UPDATE public.transfer_approval_steps
  SET action = 'returned', actor_id = auth.uid(), actor_role = v_role,
      reason = COALESCE(p_reason,'cancelled'), resolved_at = now()
  WHERE transfer_id = p_transfer_id AND action = 'pending';
END;
$$;

-- SLA sweep: escalate every overdue pending transfer not yet at dg.
CREATE OR REPLACE FUNCTION public.escalate_overdue_approvals()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.transfer_orders; v_new SMALLINT; v_due TIMESTAMPTZ; v_step INT; v_count INT := 0;
BEGIN
  FOR t IN
    SELECT * FROM public.transfer_orders
    WHERE status = 'pending_approval' AND sla_due_at IS NOT NULL
      AND now() > sla_due_at AND required_level < 8
    FOR UPDATE SKIP LOCKED
  LOOP
    v_new := public.next_rung(t.required_level);
    v_due := now() + public.sla_interval(t.priority);

    UPDATE public.transfer_approval_steps
    SET action = 'escalated', reason = 'SLA timeout', resolved_at = now()
    WHERE transfer_id = t.id AND action = 'pending';

    UPDATE public.transfer_orders
    SET required_level = v_new, escalation_count = escalation_count + 1, sla_due_at = v_due
    WHERE id = t.id;

    SELECT COALESCE(MAX(step_number),0)+1 INTO v_step
    FROM public.transfer_approval_steps WHERE transfer_id = t.id;
    INSERT INTO public.transfer_approval_steps (transfer_id, step_number, required_level, action, sla_due_at)
    VALUES (t.id, v_step, v_new, 'pending', v_due);

    PERFORM public.notify_approval_tier(t.id, v_new, 'approval_escalation',
      'Approval escalated (SLA)',
      format('Transfer %s auto-escalated to %s after SLA timeout.', t.transfer_number, public.role_for_level(v_new)));
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Authority backstop: any raw UPDATE to approved/rejected must pass the gate.
-- Named to sort before reserve_stock_on_approval.
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
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER aa_check_transfer_authority
  BEFORE UPDATE ON public.transfer_orders
  FOR EACH ROW EXECUTE FUNCTION public.check_transfer_authority();
```

- [ ] **Step 2: Apply and verify the happy path + escalation**

Run:
```bash
cd nadmo-wms-app && supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -c "
DO \$\$
DECLARE v_src UUID; v_dst UUID; v_sku UUID; v_batch TEXT; v_t UUID; v_lvl SMALLINT;
BEGIN
  SELECT id INTO v_src FROM public.warehouses ORDER BY created_at LIMIT 1;
  SELECT id INTO v_dst FROM public.warehouses WHERE id <> v_src LIMIT 1;
  SELECT sku_id, batch_lot INTO v_sku, v_batch FROM public.inventory WHERE warehouse_id = v_src AND available_quantity > 0 LIMIT 1;
  INSERT INTO public.transfer_orders (source_warehouse_id, destination_warehouse_id, created_by, priority, status)
    VALUES (v_src, v_dst, (SELECT id FROM public.profiles LIMIT 1), 'routine', 'draft') RETURNING id INTO v_t;
  INSERT INTO public.transfer_items (transfer_id, sku_id, batch_lot, quantity_dispatched) VALUES (v_t, v_sku, v_batch, 5);
  PERFORM public.submit_transfer_for_approval(v_t);
  SELECT required_level INTO v_lvl FROM public.transfer_orders WHERE id = v_t;
  RAISE NOTICE 'after submit: required_level=% (expect 2)', v_lvl;
  -- force SLA expiry and sweep
  UPDATE public.transfer_orders SET sla_due_at = now() - interval '1 hour' WHERE id = v_t;
  PERFORM public.escalate_overdue_approvals();
  SELECT required_level INTO v_lvl FROM public.transfer_orders WHERE id = v_t;
  RAISE NOTICE 'after sweep: required_level=% escalation_count=% (expect 3, 1)', v_lvl,
    (SELECT escalation_count FROM public.transfer_orders WHERE id = v_t);
  RAISE NOTICE 'open steps=% (expect 1)', (SELECT count(*) FROM public.transfer_approval_steps WHERE transfer_id = v_t AND action='pending');
END \$\$;"
```
Expected NOTICEs: `required_level=2` after submit; `required_level=3 escalation_count=1` after sweep; `open steps=1`.

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/supabase/migrations/00017_approval_chain_workflow.sql
git commit -m "feat(db): approval-chain workflow RPCs and authority guard"
```

---

### Task 7: Migration — RLS for new tables (`00018` part A) + pg_cron schedule

**Files:**
- Create: `nadmo-wms-app/supabase/migrations/00018_approval_chain_rls_cron.sql`

**Interfaces:**
- Consumes: `escalate_overdue_approvals()` from Task 6.

- [ ] **Step 1: Write the migration**

```sql
-- Migration: RLS for approval-chain tables + pg_cron SLA schedule

ALTER TABLE public.transfer_approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_sla_config ENABLE ROW LEVEL SECURITY;

-- Steps: readable by anyone who can read the parent transfer order.
CREATE POLICY approval_steps_select ON public.transfer_approval_steps
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.transfer_orders t WHERE t.id = transfer_id));
-- No INSERT/UPDATE/DELETE policy: only SECURITY DEFINER RPCs write here.

-- SLA config: readable by all authenticated; writable by threshold managers.
CREATE POLICY sla_config_select ON public.approval_sla_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY sla_config_write ON public.approval_sla_config
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('dg','hq_logistics','hq_procurement','regional_manager','sysadmin'))
  WITH CHECK (public.current_user_role() IN ('dg','hq_logistics','hq_procurement','regional_manager','sysadmin'));

-- Grant execute on RPCs to authenticated callers.
GRANT EXECUTE ON FUNCTION public.submit_transfer_for_approval(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_transfer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_transfer(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.escalate_transfer(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_transfer(UUID, TEXT) TO authenticated;

-- pg_cron: sweep overdue approvals every 5 minutes.
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('escalate-overdue-approvals', '*/5 * * * *',
  $$SELECT public.escalate_overdue_approvals();$$);
```

- [ ] **Step 2: Apply and verify**

Run:
```bash
cd nadmo-wms-app && supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT jobname, schedule FROM cron.job WHERE jobname = 'escalate-overdue-approvals';"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT relrowsecurity FROM pg_class WHERE relname = 'transfer_approval_steps';"
```
Expected: one cron job row with schedule `*/5 * * * *`; `relrowsecurity` = `t`.

> If `supabase db reset` errors that `pg_cron` is unavailable, enable it in `supabase/config.toml` under `[db]` extensions, or for the hosted project enable it in Dashboard → Database → Extensions, then re-run.

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/supabase/migrations/00018_approval_chain_rls_cron.sql
git commit -m "feat(db): approval-chain RLS and pg_cron SLA sweep"
```

---

### Task 8: Server actions for approval actions

**Files:**
- Create: `nadmo-wms-app/app/(dashboard)/transfers/[id]/actions.ts`

**Interfaces:**
- Consumes RPCs from Task 6.
- Produces: `approveTransfer(id)`, `rejectTransfer(id, reason)`, `escalateTransfer(id, reason)`, `resubmitTransfer(id)`, `cancelTransfer(id, reason)`, each returning `ActionResult = { ok: boolean; error?: string }`.

- [ ] **Step 1: Write the server actions**

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function callRpc(id: string, fn: string, args: Record<string, unknown>): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { error } = await supabase.rpc(fn, args);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/transfers/${id}`);
  revalidatePath('/transfers');
  return { ok: true };
}

export async function approveTransfer(id: string): Promise<ActionResult> {
  return callRpc(id, 'approve_transfer', { p_transfer_id: id });
}

export async function rejectTransfer(id: string, reason: string): Promise<ActionResult> {
  if (!reason.trim()) return { ok: false, error: 'A reason is required.' };
  return callRpc(id, 'reject_transfer', { p_transfer_id: id, p_reason: reason.trim() });
}

export async function escalateTransfer(id: string, reason: string): Promise<ActionResult> {
  if (!reason.trim()) return { ok: false, error: 'A reason is required.' };
  return callRpc(id, 'escalate_transfer', { p_transfer_id: id, p_reason: reason.trim() });
}

export async function resubmitTransfer(id: string): Promise<ActionResult> {
  return callRpc(id, 'submit_transfer_for_approval', { p_transfer_id: id });
}

export async function cancelTransfer(id: string, reason: string): Promise<ActionResult> {
  return callRpc(id, 'cancel_transfer', { p_transfer_id: id, p_reason: reason.trim() || 'cancelled' });
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd nadmo-wms-app && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "nadmo-wms-app/app/(dashboard)/transfers/[id]/actions.ts"
git commit -m "feat(transfers): server actions for approve/reject/escalate/resubmit/cancel"
```

---

### Task 9: Route creation through the submit RPC

**Files:**
- Modify: `nadmo-wms-app/components/transfers/transfer-form.tsx`
- Modify: `nadmo-wms-app/supabase/functions/create-transfer/index.ts`

**Interfaces:**
- Consumes: `submit_transfer_for_approval` RPC.

- [ ] **Step 1: Update the client form to create-as-draft then submit**

In `nadmo-wms-app/components/transfers/transfer-form.tsx` `handleSubmit`, change the insert `status` to `'draft'` and call the RPC after items are inserted. Replace the order-insert block and add the RPC call:

```typescript
      // Create transfer order as a draft
      const { data: transfer, error: transferError } = await supabase
        .from('transfer_orders')
        .insert({
          source_warehouse_id: sourceWarehouseId,
          destination_warehouse_id: destinationWarehouseId,
          created_by: user.id,
          priority,
          expected_delivery_at: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : null,
          notes,
          status: 'draft',
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // Create transfer items
      const { error: itemsError } = await supabase.from('transfer_items').insert(
        validItems.map((item) => ({
          ...item,
          transfer_id: transfer.id,
        }))
      );

      if (itemsError) throw itemsError;

      // Submit for approval — routing (scale, required tier, SLA) computed server-side now items exist
      const { error: submitError } = await supabase.rpc('submit_transfer_for_approval', {
        p_transfer_id: transfer.id,
      });
      if (submitError) throw submitError;

      toast.success(`Transfer ${transfer.transfer_number} submitted for approval`);
      router.push(`/transfers/${transfer.id}`);
      router.refresh();
```

- [ ] **Step 2: Update the create-transfer edge function the same way**

In `nadmo-wms-app/supabase/functions/create-transfer/index.ts`, replace the transfer insert + items insert + response section. Insert as `draft`, insert items, then call the RPC. Remove the now-unused `determineScale`/`scale` computation:

```typescript
    // Create transfer order as a draft (routing computed on submit)
    const { data: transfer, error: transferError } = await supabaseClient
      .from('transfer_orders')
      .insert({
        source_warehouse_id: payload.source_warehouse_id,
        destination_warehouse_id: payload.destination_warehouse_id,
        created_by: user.id,
        priority: payload.priority || 'routine',
        expected_delivery_at: payload.expected_delivery_at || null,
        notes: payload.notes || null,
        status: 'draft',
      })
      .select()
      .single();

    if (transferError) throw transferError;

    const { error: itemsError } = await supabaseClient.from('transfer_items').insert(
      payload.items.map((item) => ({
        transfer_id: transfer.id,
        sku_id: item.sku_id,
        quantity_dispatched: item.quantity_dispatched,
        batch_lot: item.batch_lot || 'DEFAULT',
      }))
    );

    if (itemsError) throw itemsError;

    const { error: submitError } = await supabaseClient.rpc('submit_transfer_for_approval', {
      p_transfer_id: transfer.id,
    });
    if (submitError) throw submitError;

    return new Response(JSON.stringify({ transfer }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
```

Also delete the `function determineScale(...)` block and the `const totalQuantity ... const scale = ...` lines above the insert.

- [ ] **Step 3: Verify it type-checks**

Run: `cd nadmo-wms-app && npx tsc --noEmit`
Expected: no errors (the edge function is Deno; tsc covers the form).

- [ ] **Step 4: Commit**

```bash
git add nadmo-wms-app/components/transfers/transfer-form.tsx nadmo-wms-app/supabase/functions/create-transfer/index.ts
git commit -m "feat(transfers): create as draft then submit via routing RPC"
```

---

### Task 10: Status badge — `rejected`

**Files:**
- Modify: `nadmo-wms-app/components/ui/status-badge.tsx`

- [ ] **Step 1: Add the rejected style**

In `statusStyles`, add after the `discrepancy` line:

```typescript
  rejected: 'bg-red-50 text-red-700 border-red-200',
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd nadmo-wms-app && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/components/ui/status-badge.tsx
git commit -m "feat(ui): rejected status badge"
```

---

### Task 11: Transfer actions UI — approve/reject/escalate/resubmit/cancel

**Files:**
- Modify: `nadmo-wms-app/components/transfers/transfer-actions.tsx`

**Interfaces:**
- Consumes: server actions from Task 8; `canApproveAtLevel`, `nextRung`, `ROLE_LABELS`, `role_for_level` mapping via `requiredLevelForScale` from Task 1.

- [ ] **Step 1: Rewrite the pending-approval branch and add reject/escalate**

In `nadmo-wms-app/components/transfers/transfer-actions.tsx`:

1. Update imports:

```typescript
import { canApproveAtLevel, nextRung, ROLE_LABELS } from '@/lib/auth';
import {
  approveTransfer,
  rejectTransfer,
  escalateTransfer,
  resubmitTransfer,
  cancelTransfer,
} from '@/app/(dashboard)/transfers/[id]/actions';
```

Keep the existing `canApproveTransfer` import removed (no longer used). Keep `UserRole` import.

2. Add state for the reason dialogs near the other `useState` calls:

```typescript
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<null | 'reject' | 'escalate'>(null);
```

3. Replace the `const canApprove = ...` line with level-based gating:

```typescript
  const requiredLevel = transfer.required_level ?? 99;
  const canApprove = !!profile && canApproveAtLevel(role, requiredLevel);
  const isCreator = profile?.id === transfer.created_by;
  const nextLevel = nextRung(requiredLevel);
  const ROLE_BY_LEVEL: Record<number, UserRole> = {
    2: 'district_officer', 3: 'regional_manager', 5: 'hq_logistics', 8: 'dg',
  };
```

4. Add handlers (place beside the existing `handleApprove`):

```typescript
  async function runAction(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    setLoading(true);
    try {
      const res = await fn();
      if (!res.ok) throw new Error(res.error);
      toast.success(ok);
      setMode(null);
      setReason('');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  }
```

Replace the body of `handleApprove` with:

```typescript
  async function handleApprove() {
    await runAction(() => approveTransfer(transfer.id), 'Transfer approved');
  }
```

5. Replace the `if (transfer.status === 'pending_approval' && canApprove)` block with a richer header that shows the current required tier, SLA, escalation badge, and the approve/reject/escalate controls. Also handle the `rejected` creator branch:

```typescript
  if (transfer.status === 'pending_approval') {
    const slaLabel = transfer.sla_due_at
      ? new Date(transfer.sla_due_at).toLocaleString('en-GB')
      : '—';
    return (
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">Awaiting</span>
          <span className="font-medium">{ROLE_LABELS[ROLE_BY_LEVEL[requiredLevel] ?? 'dg']}</span>
          <span className="text-muted-foreground">· SLA due {slaLabel}</span>
          {transfer.escalation_count > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              Escalated ×{transfer.escalation_count}
            </span>
          )}
        </div>

        {canApprove && mode === null && (
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleApprove} disabled={loading} className="bg-[#006B3F] hover:bg-[#024F2E]">
              Approve Transfer
            </Button>
            <Button onClick={() => setMode('reject')} disabled={loading} variant="outline">
              Reject
            </Button>
            {nextLevel !== requiredLevel && (
              <Button onClick={() => setMode('escalate')} disabled={loading} variant="outline">
                Escalate to {ROLE_LABELS[ROLE_BY_LEVEL[nextLevel] ?? 'dg']}
              </Button>
            )}
          </div>
        )}

        {canApprove && mode !== null && (
          <div className="space-y-3">
            <Label>{mode === 'reject' ? 'Rejection reason' : 'Escalation reason'}</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required" />
            <div className="flex gap-3">
              <Button
                disabled={loading || !reason.trim()}
                className="bg-[#006B3F] hover:bg-[#024F2E]"
                onClick={() =>
                  mode === 'reject'
                    ? runAction(() => rejectTransfer(transfer.id, reason), 'Transfer rejected')
                    : runAction(() => escalateTransfer(transfer.id, reason), 'Transfer escalated')
                }
              >
                Confirm {mode === 'reject' ? 'Rejection' : 'Escalation'}
              </Button>
              <Button variant="ghost" disabled={loading} onClick={() => { setMode(null); setReason(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!canApprove && (
          <p className="text-sm text-muted-foreground">You do not have authority to action this transfer at its current tier.</p>
        )}
      </Card>
    );
  }

  if (transfer.status === 'rejected') {
    return (
      <Card className="p-4 space-y-3">
        <div>
          <h3 className="font-medium">Transfer rejected</h3>
          {transfer.rejection_reason && (
            <p className="text-sm text-muted-foreground">Reason: {transfer.rejection_reason}</p>
          )}
        </div>
        {isCreator && (
          <div className="flex gap-3">
            <Button
              disabled={loading}
              className="bg-[#006B3F] hover:bg-[#024F2E]"
              onClick={() => runAction(() => resubmitTransfer(transfer.id), 'Resubmitted for approval')}
            >
              Resubmit
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => runAction(() => cancelTransfer(transfer.id, 'Cancelled by creator'), 'Transfer cancelled')}
            >
              Cancel Transfer
            </Button>
          </div>
        )}
      </Card>
    );
  }
```

Leave the existing `approved` / `in_transit` branches unchanged. Remove the now-unused `updateStatus` helper only if it is no longer referenced by those branches — it still is (dispatch/receive), so keep it.

- [ ] **Step 2: Verify it type-checks**

Run: `cd nadmo-wms-app && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add nadmo-wms-app/components/transfers/transfer-actions.tsx
git commit -m "feat(transfers): approve/reject/escalate/resubmit UI with tier + SLA"
```

---

### Task 12: Command-chain timeline + load steps on detail page

**Files:**
- Modify: `nadmo-wms-app/components/transfers/transfer-timeline.tsx`
- Modify: `nadmo-wms-app/app/(dashboard)/transfers/[id]/page.tsx`

**Interfaces:**
- Consumes: `transfer.approval_steps?: TransferApprovalStep[]` (Task 2); `ROLE_LABELS`.

- [ ] **Step 1: Load approval steps on the detail page**

In `nadmo-wms-app/app/(dashboard)/transfers/[id]/page.tsx`, after the `items` query add:

```typescript
  const { data: approvalSteps } = await supabase
    .from('transfer_approval_steps')
    .select('*, actor:actor_id(*)')
    .eq('transfer_id', id)
    .order('step_number');
```

Then pass them into the timeline by replacing `<TransferTimeline transfer={transfer} />` with:

```typescript
          <TransferTimeline transfer={transfer} approvalSteps={approvalSteps || []} />
```

- [ ] **Step 2: Render the command chain in the timeline**

In `nadmo-wms-app/components/transfers/transfer-timeline.tsx`, update the props and prepend an approval-chain section. Replace the imports and `interface TransferTimelineProps`:

```typescript
import { TransferOrder, TransferApprovalStep } from '@/types';
import { ROLE_LABELS } from '@/lib/auth';

interface TransferTimelineProps {
  transfer: TransferOrder;
  approvalSteps?: TransferApprovalStep[];
}
```

Change the function signature to `export function TransferTimeline({ transfer, approvalSteps = [] }: TransferTimelineProps) {` and, immediately inside the returned outer `<div className="bg-white rounded-lg border p-6">`, before the existing `<h3>Transfer Timeline</h3>`, insert the chain block:

```tsx
      {approvalSteps.length > 0 && (
        <div className="mb-8">
          <h3 className="font-medium mb-4">Command Chain</h3>
          <div className="space-y-3">
            {approvalSteps.map((step) => {
              const roleLabel =
                ({ 2: 'District Warehouse Officer', 3: 'Regional Manager', 5: 'HQ Logistics Officer', 8: 'Director-General' } as Record<number, string>)[
                  step.required_level
                ] ?? `Level ${step.required_level}`;
              const actor = step.actor ? `${step.actor.first_name} ${step.actor.last_name}` : null;
              return (
                <div key={step.id} className="flex items-start justify-between gap-4 text-sm border-b last:border-0 pb-2">
                  <div>
                    <div className="font-medium">{roleLabel}</div>
                    {step.reason && <div className="text-xs text-muted-foreground">{step.reason}</div>}
                  </div>
                  <div className="text-right">
                    <div className="capitalize">{step.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {step.action === 'pending'
                        ? step.sla_due_at
                          ? `SLA ${new Date(step.sla_due_at).toLocaleString('en-GB')}`
                          : 'Pending'
                        : step.resolved_at
                          ? new Date(step.resolved_at).toLocaleString('en-GB')
                          : ''}
                      {actor ? ` · ${actor}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
```

(`ROLE_LABELS` import is available for future use; the inline map keeps level→label local. If lint flags `ROLE_LABELS` as unused, drop that import line.)

- [ ] **Step 3: Verify it type-checks**

Run: `cd nadmo-wms-app && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add nadmo-wms-app/components/transfers/transfer-timeline.tsx "nadmo-wms-app/app/(dashboard)/transfers/[id]/page.tsx"
git commit -m "feat(transfers): command-chain timeline from approval steps"
```

---

### Task 13: Transfer list — escalation/overdue badges

**Files:**
- Modify: `nadmo-wms-app/components/transfers/transfer-list.tsx`

**Interfaces:**
- Consumes: `transfer.escalation_count`, `transfer.status`, `transfer.sla_due_at` (already selected via `*` on the list page).

- [ ] **Step 1: Add badges in the Status cell**

In `nadmo-wms-app/components/transfers/transfer-list.tsx`, replace the Status `<TableCell>`:

```tsx
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={transfer.status} />
                  {transfer.escalation_count > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      ↑{transfer.escalation_count}
                    </span>
                  )}
                  {transfer.status === 'pending_approval' &&
                    transfer.sla_due_at &&
                    new Date(transfer.sla_due_at) < new Date() && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        Overdue
                      </span>
                    )}
                </div>
              </TableCell>
```

- [ ] **Step 2: Verify the list page selects the new columns**

Run: `grep -n "from('transfer_orders')" "nadmo-wms-app/app/(dashboard)/transfers/page.tsx"`
Expected: a `.select('*'...)` (wildcard already includes the new columns). If it selects an explicit column list rather than `*`, add `escalation_count, sla_due_at, required_level` to it.

- [ ] **Step 3: Verify it type-checks**

Run: `cd nadmo-wms-app && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add nadmo-wms-app/components/transfers/transfer-list.tsx
git commit -m "feat(transfers): escalation and overdue badges in list"
```

---

### Task 14: Full build + lint gate

**Files:** none (verification only).

- [ ] **Step 1: Run the test suite**

Run: `cd nadmo-wms-app && npm run test`
Expected: all pass.

- [ ] **Step 2: Lint and build**

Run: `cd nadmo-wms-app && npm run lint && npm run build`
Expected: lint clean (fix any unused-import warnings, e.g. drop `ROLE_LABELS` in the timeline if reported); build succeeds.

- [ ] **Step 3: Commit any lint fixes**

```bash
git add -A
git commit -m "chore(transfers): lint and build fixes for approval chain"
```

---

## Self-Review

**Spec coverage:**
- Command-chain ladder & scale→tier → Tasks 1, 5 (`requiredLevelForScale`, `scale_required_level`). ✓
- Hybrid gate (level ≥ required, ladder/sysadmin only) → `canApproveAtLevel` (T1), `is_approver_role`+guard (T5/T6). ✓
- Emergency start-high, stock-risk floor → `submit_transfer_for_approval` (T6) using `next_rung`, `would_breach_stock` (T5). ✓
- SLA timeout via pg_cron → `escalate_overdue_approvals` (T6) + schedule (T7). ✓
- Manual escalation → `escalate_transfer` RPC (T6) + UI (T11). ✓
- Reject → back to creator → `rejected` enum (T3), `reject_transfer` (T6), resubmit path (T6/T8/T11). ✓
- Data model (columns, steps table, sla_config) → T2/T4. ✓
- Authority enforced server-side → guard trigger (T6) + RPCs; UI gating (T11). ✓
- One creation code path → both form and edge fn route through submit RPC (T9). ✓
- Notifications (`approval_required`/`approval_escalation`, recipient resolution) → `notify_approval_tier` (T5), emitted in T6. SMS for emergency: see note below.
- UI: actions, timeline command chain, list badges → T10–T13. ✓

**Scope note — emergency SMS:** The spec lists SMS via `send-sms` for emergency-priority approvals. This plan emits in-app notifications for all tiers but does NOT wire the `send-sms` edge function into `notify_approval_tier` (it would require an HTTP call from Postgres via `pg_net`, a separate concern). Flagged as a deliberate follow-up so the core chain ships first; add as a later task if required before launch.

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `required_level`/`sla_due_at`/`escalation_count` names match across T2 types, T4 columns, T6 RPCs, T11–T13 UI. RPC arg names (`p_transfer_id`, `p_reason`) match between T6 definitions and T8 callers. `submit_transfer_for_approval` used identically in T6/T8/T9. ✓
