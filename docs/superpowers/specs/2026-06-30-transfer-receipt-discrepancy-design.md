# Transfer Receipt & Discrepancy Flow — Design

Date: 2026-06-30
Status: Approved (design)
Scope: Receipt of in-transit inter-warehouse transfers into the destination warehouse, including discrepancy capture and resolution, for `nadmo-wms-app`.

## Problem

Today receipt is a direct client write with no real gate or structure:

- `transfer-actions.tsx` shows the "Confirm Receipt" form for any `in_transit` transfer to **any authenticated viewer** — no role/warehouse gate in the component. RLS (`00007`) only requires the actor be dg/hq/sysadmin **or** assigned to the source **or** destination warehouse, so a source-side officer can "receive".
- Only `quantity_received` is captured. **Condition is never set** (defaults `good`), despite the `transfer_items.condition` column.
- No proof-of-delivery, no discrepancy reason/photos captured, despite `digital_signature`, `signature_data`, `discrepancy_reason`, `discrepancy_photos` columns existing.
- The `process_transfer_dispatch_receipt` trigger adds destination stock on `→received`, then flips `status='discrepancy'` on any quantity mismatch. There is **no resolution path** out of `discrepancy`, and no notifications are emitted.
- Over-receipt (received > dispatched) is silently accepted.

## Decisions (from brainstorming)

- **Receiver:** destination warehouse staff only — `district_officer`/`field_officer` assigned to the destination warehouse, plus `hq_logistics`/`dg`/`sysadmin` override. Source-side users blocked.
- **Condition → inventory:** quantity-only. All received quantity adds to destination available stock regardless of condition. `condition` is stored on the line for audit only.
- **Discrepancy:** require a reason at receipt; notify source + HQ; provide a resolution/acknowledge step; block over-receipt.
- **Proof of delivery:** `received_by` + `received_at` only. No signature/photo capture for PoD itself (discrepancy photos are separate and optional).

## Key design choice — decouple discrepancy from `status`

Because all received quantity must land in inventory **even when there is a discrepancy**, and because a resolution step must not re-trigger inventory addition, discrepancy is tracked on a **separate dimension**, not on `transfer_orders.status`:

- `status` becomes `received` on every successful receipt (so the inventory-add trigger fires exactly once and stock lands).
- A new `discrepancy_status` column (`none|open|resolved`) carries the discrepancy lifecycle.
- Resolution flips `discrepancy_status`, never `status`, so inventory is never double-added.

The legacy `'discrepancy'` value in the `transfer_status` enum is retained for backward compatibility but is no longer written by the receipt path.

## Authorization

`receive_transfer` is permitted only when the order is `in_transit` AND:

- caller role ∈ (`hq_logistics`, `dg`, `sysadmin`), OR
- caller role ∈ (`district_officer`, `field_officer`) AND `user_has_warehouse(destination_warehouse_id)`.

Enforced in two layers (mirrors the approval-chain design):
1. **DB:** the `receive_transfer` RPC checks the rule and raises on failure; a `BEFORE UPDATE` guard on `transfer_orders` also blocks any raw `in_transit → received` transition that does not satisfy the rule.
2. **UI:** the receive form renders only for receiver-capable roles.

`resolve_discrepancy` is permitted to `hq_logistics`/`dg`/`sysadmin` or a source-warehouse officer (`district_officer`/`field_officer` assigned to `source_warehouse_id`).

## Data Model

### `transfer_orders` — new columns

| Column                        | Type        | Notes                                  |
|-------------------------------|-------------|----------------------------------------|
| `discrepancy_status`          | enum `public.discrepancy_status` (`none`,`open`,`resolved`) NOT NULL DEFAULT `none` | Discrepancy lifecycle. |
| `discrepancy_resolved_by`     | uuid REFERENCES profiles(id) | Set on resolution.           |
| `discrepancy_resolved_at`     | timestamptz |                                        |
| `discrepancy_resolution_note` | text        | Required at resolution.                |

Reused existing columns: `received_by`, `received_at`, `actual_delivery_at`, `discrepancy_reason`, `discrepancy_photos`.

### `transfer_items`

Reuse `quantity_received` and `condition` (`good|damaged|expired|missing`). Condition is captured for audit; it does not change how much stock is added.

### New enum

```sql
CREATE TYPE public.discrepancy_status AS ENUM ('none', 'open', 'resolved');
```

## Receipt RPC

`public.receive_transfer(p_transfer_id uuid, p_lines jsonb, p_reason text, p_photos text[])` — SECURITY DEFINER.

`p_lines` shape: `[{ "item_id": uuid, "quantity_received": int, "condition": item_condition }, ...]`.

Logic:
1. Load order `FOR UPDATE`; require `status = 'in_transit'`.
2. Authorize per the rule above (raise on failure).
3. For each line:
   - look up the matching `transfer_items` row (must belong to this transfer);
   - **block over-receipt:** `quantity_received > quantity_dispatched` → raise;
   - update `quantity_received` and `condition`.
4. Compute `v_mismatch` = any line where `quantity_received <> quantity_dispatched` OR `condition <> 'good'`.
5. If `v_mismatch`: require non-empty `p_reason`; set `discrepancy_status='open'`, `discrepancy_reason=p_reason`, `discrepancy_photos=p_photos`.
6. Set `received_by=auth.uid()`, `received_at=now()`, `actual_delivery_at=now()`, `status='received'`.
7. Notifications: `transfer_received` to `created_by` and the source warehouse officer(s). If `v_mismatch`: `discrepancy` to source officer(s) + all `hq_logistics`.

Inventory addition is **not** done here — it is owned by the trigger (below), which fires on `status → received`.

## Inventory Recording (trigger, refactored)

Refactor `public.process_transfer_dispatch_receipt`:

- **Dispatch branch (`→ in_transit`):** unchanged.
- **Receipt branch (`→ received`):** unchanged inventory behavior — for each item, insert the destination batch (carrying the source batch `expiry_date`) or `+=` `COALESCE(quantity_received, quantity_dispatched)`, and log an `inventory_transactions` `transfer_in` row.
- **Remove** the block that does `UPDATE transfer_orders SET status='discrepancy'` on mismatch. Discrepancy is now carried by `discrepancy_status`, set in the RPC.

This keeps inventory addition caller-independent (any path reaching `received` adds stock exactly once) while the RPC owns validation, condition, and discrepancy.

## Resolution RPC

`public.resolve_discrepancy(p_transfer_id uuid, p_note text)` — SECURITY DEFINER.

1. Require non-empty `p_note`.
2. Load order; require `discrepancy_status = 'open'`.
3. Authorize: role ∈ (`hq_logistics`,`dg`,`sysadmin`) OR (`district_officer`/`field_officer` assigned to `source_warehouse_id`).
4. Set `discrepancy_status='resolved'`, `discrepancy_resolved_by=auth.uid()`, `discrepancy_resolved_at=now()`, `discrepancy_resolution_note=p_note`.
5. Notify `received_by` and `created_by` that the discrepancy was resolved (`system`).

## Authority Guard (trigger)

Extend the existing `public.check_transfer_authority` (`aa_check_transfer_authority`, from the approval-chain work) with a receipt clause:

- When `NEW.status='received' AND OLD.status='in_transit'`: raise unless the caller satisfies the receive authorization rule (role override, or destination-assigned officer). This backstops the RPC against raw updates.

`user_has_warehouse(uuid)` (existing, `00007`) provides the assignment check; a companion `public.user_has_warehouse_for(uid, warehouse)` is not needed because the guard runs as the acting user (`auth.uid()`).

## TypeScript

`types/index.ts`:
- `DiscrepancyStatus = 'none' | 'open' | 'resolved'`.
- Add to `TransferOrder`: `discrepancy_status`, `discrepancy_resolved_by`, `discrepancy_resolved_at`, `discrepancy_resolution_note`.

`lib/auth.ts` (pure, unit-tested):
- `RECEIVER_ROLES: UserRole[] = ['district_officer','field_officer','hq_logistics','dg','sysadmin']`.
- `canReceiveTransfer(role: UserRole): boolean` — role ∈ RECEIVER_ROLES. (Warehouse assignment is enforced in the DB, not the pure helper.)
- `canResolveDiscrepancy(role: UserRole): boolean` — role ∈ (`district_officer`,`field_officer`,`hq_logistics`,`dg`,`sysadmin`).

## Server Actions

`app/(dashboard)/transfers/[id]/actions.ts` (existing file):
- `receiveTransfer(id, lines, reason, photos?)` → rpc `receive_transfer`.
- `resolveDiscrepancy(id, note)` → rpc `resolve_discrepancy`.

`lines` typed as `{ item_id: string; quantity_received: number; condition: TransferItem['condition'] }[]`.

## UI

- `components/transfers/transfer-actions.tsx`, `in_transit` branch:
  - render only for `canReceiveTransfer(role)`;
  - per line: quantity input + **condition select** (good/damaged/expired/missing);
  - if any line mismatches (qty or condition), reveal a required **discrepancy reason** field;
  - submit calls `receiveTransfer`.
- Detail page (`app/(dashboard)/transfers/[id]/page.tsx`): when `discrepancy_status <> 'none'`, show a discrepancy panel (reason, photos, status, resolver/note). When `discrepancy_status='open'` and `canResolveDiscrepancy(role)`, show a **Resolve** action (note required).
- `components/transfers/transfer-list.tsx`: show a "Discrepancy" badge when `discrepancy_status='open'` (independent of `status`).
- `components/ui/status-badge.tsx`: no change needed (discrepancy now a separate badge).

## Notifications

Reuse existing `notification_type` values: `transfer_received`, `discrepancy`, `system`. Recipient resolution reuses the warehouse/role join pattern from `notify_approval_tier` / `evaluate_stock_alerts` (source officer = `district_officer`/`field_officer` assigned to source warehouse; HQ = all `hq_logistics`).

## Migrations (append-only; next free numbers)

1. `00019_receipt_discrepancy_schema.sql` — `discrepancy_status` enum + new `transfer_orders` columns.
2. `00020_receipt_workflow.sql` — `receive_transfer`, `resolve_discrepancy`, refactored `process_transfer_dispatch_receipt`, extended `check_transfer_authority`.
3. `00021_receipt_rls_grants.sql` — grants on the new RPCs to `authenticated`.

## Testing

- `lib/auth.test.ts` — `canReceiveTransfer`, `canResolveDiscrepancy` across all roles.
- SQL assertion checks (run against a DB): clean receipt (no discrepancy) adds stock and sets `status='received'`, `discrepancy_status='none'`; short receipt requires a reason, sets `discrepancy_status='open'`, still adds the received quantity; over-receipt raises; `resolve_discrepancy` flips `open→resolved`; a source-warehouse officer cannot receive; a non-assigned officer is blocked by the guard.

## Out of Scope (YAGNI)

- Quarantine/separate buckets for damaged/expired stock (decided: quantity-only).
- Signature / delivery-photo proof of delivery (decided: `received_by` only).
- Partial / multi-leg receipts (a transfer is received once, in full).
