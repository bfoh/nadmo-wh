# NADMO Transfer Escalation & Approval Chain — Design

Date: 2026-06-30
Status: Approved (design)
Scope: Inter-warehouse transfer approval workflow for `nadmo-wms-app`

## Problem

The current transfer flow has a single approval step. The `create-transfer` edge
function inserts an order at `pending_approval`, and `transfer-actions.tsx` lets any
role that passes `canApproveTransfer(role, scale)` move it straight to `approved`.

Gaps:
- No multi-tier command chain; one approval clears any transfer.
- No `rejected` status and no rejection path.
- No escalation: the `approval_escalation` notification type exists but nothing emits it.
- No SLA / timeout handling; there is no scheduler in the app.
- `approved_by` / `approved_at` are single columns — no record of who was responsible at
  each rung of the chain.
- Authority is enforced only client-side; a crafted request could bypass `canApproveTransfer`.

## Goals

- Authority escalates **up** the NADMO command chain, never down.
- A full, queryable audit of every rung of the chain (who was responsible, what they did, when).
- Four escalation triggers: emergency start-high, stock-risk, SLA timeout, manual.
- A rejection path that returns the transfer to the creator for edit & resubmit.
- Server-side authority enforcement (defense in depth), independent of the client.

## Non-Goals (YAGNI)

- Sequential multi-step approval (every tier must sign). We use a single gate that escalates.
- Configurable per-warehouse approval routing. Scale → tier mapping is global.
- Delegation / out-of-office reassignment. Manual escalation covers the urgent case.

## Command-Chain Ladder

Approver tiers, by existing `ROLE_HIERARCHY` level (`lib/auth.ts`):

```
district_officer(2) → regional_manager(3) → hq_logistics(5) → dg(8)
```

Scale sets the **starting required tier** (preserves current `canApproveTransfer` semantics):

| Scale     | Starts at              | Total qty |
|-----------|------------------------|-----------|
| routine   | district_officer (2)   | < 100     |
| standard  | regional_manager (3)   | < 500     |
| large     | hq_logistics (5)       | < 2000    |
| strategic | dg (8)                 | ≥ 2000    |

`sysadmin(9)` always clears (level ≥ any required_level). `auditor(7)` is oversight only and
is **not** an approver tier despite its hierarchy number — approval eligibility is defined by the
ladder set above, not by raw level alone. See "Authorization enforcement".

**Hybrid gate:** any user whose role level ≥ the transfer's current `required_level` AND whose
role is an approver tier (or sysadmin) clears it. Escalation raises `required_level` to the next
rung above the current one, capped at `dg(8)`.

`next_rung(level)`:
```
2 → 3 → 5 → 8 → 8 (capped)
```

## Data Model

### `transfer_orders` — new columns

| Column            | Type          | Notes                                            |
|-------------------|---------------|--------------------------------------------------|
| `required_level`  | smallint      | Current gate (role hierarchy level).             |
| `sla_due_at`      | timestamptz   | When the current rung times out.                 |
| `escalation_count`| smallint NOT NULL DEFAULT 0 | Number of times escalated.         |
| `submitted_at`    | timestamptz   | Set on entering `pending_approval`; reset on resubmit. |
| `rejected_by`     | uuid REFERENCES profiles(id) | Null until rejected.              |
| `rejected_at`     | timestamptz   |                                                  |
| `rejection_reason`| text          | Required when rejecting.                         |

### `transfer_status` enum — add value

Add `rejected`. (Postgres: `ALTER TYPE public.transfer_status ADD VALUE 'rejected';` in its own
migration — enum additions cannot run in the same transaction that uses the value.)

### New table `transfer_approval_steps`

The command chain. One row per rung the transfer occupies.

```sql
CREATE TYPE public.approval_action AS ENUM (
  'pending', 'approved', 'rejected', 'escalated', 'returned'
);

CREATE TABLE public.transfer_approval_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id   UUID NOT NULL REFERENCES public.transfer_orders(id) ON DELETE CASCADE,
  step_number   INTEGER NOT NULL,
  required_level SMALLINT NOT NULL,
  action        public.approval_action NOT NULL DEFAULT 'pending',
  actor_id      UUID REFERENCES public.profiles(id),
  actor_role    public.user_role,
  reason        TEXT,
  sla_due_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ,
  UNIQUE (transfer_id, step_number)
);
CREATE INDEX idx_approval_steps_transfer ON public.transfer_approval_steps(transfer_id);
CREATE INDEX idx_approval_steps_open ON public.transfer_approval_steps(transfer_id)
  WHERE action = 'pending';
```

Exactly one `pending` step exists per transfer while it is in `pending_approval`. Closing a step
sets `action` to its outcome, `actor_id`/`actor_role`/`reason` as applicable, and `resolved_at`.

### New table `approval_sla_config`

```sql
CREATE TABLE public.approval_sla_config (
  priority public.transfer_priority PRIMARY KEY,
  window_hours NUMERIC NOT NULL
);
INSERT INTO public.approval_sla_config (priority, window_hours) VALUES
  ('emergency', 1), ('urgent', 4), ('routine', 24);
```

`sla_interval(priority)` returns `window_hours * interval '1 hour'`.

## Escalation Triggers

All four computed in SQL so they hold regardless of entry point (edge function, server action,
direct insert).

1. **Emergency start-high** — on submit, if `priority = 'emergency'`, set
   `required_level = next_rung(scale_level)`.
2. **Stock-risk** — on submit, for each item compute projected source availability
   (`available_quantity - quantity_dispatched`). If any item would fall at/below its applicable
   `warehouse_thresholds.min_quantity` (same resolution order as `evaluate_stock_alerts`:
   warehouse-specific → category default), force `required_level = GREATEST(required_level, 5)`
   (hq_logistics).
3. **SLA timeout** — `pg_cron` every 5 minutes calls `escalate_overdue_approvals()`.
4. **Manual escalation** — approver action; one rung bump with a required reason.

Start-high and stock-risk both apply at submit; the resulting `required_level` is the max of all
applicable rules, still capped at `dg(8)`.

## State Machine

```
draft ──submit──▶ pending_approval ──approve──▶ approved ──▶ (existing dispatch / receipt flow)
                       │      ▲
              reject(reason)  resubmit (creator)
                       ▼      │
                    rejected ──cancel──▶ cancelled

pending_approval ──escalate (sla | manual)──▶ pending_approval   (required_level raised one rung)
```

Existing triggers are unchanged:
- `reserve_transfer_stock` (fires on `→ approved`) — reserves source stock, sets final scale.
- `process_transfer_dispatch_receipt` — dispatch deduction / receipt addition / discrepancy.

## Functions & Triggers (Postgres)

Helpers:
- `scale_required_level(scale) → smallint` — {routine:2, standard:3, large:5, strategic:8}.
- `next_rung(level smallint) → smallint` — 2→3→5→8→8.
- `sla_interval(priority) → interval` — from `approval_sla_config`.
- `is_approver_role(role) → boolean` — role ∈ ladder set or `sysadmin`.
- `would_breach_stock(transfer_id) → boolean` — stock-risk test described above.

Submit (status → `pending_approval`, on INSERT or from `draft`/`rejected`):
- Compute `base = scale_required_level(scale)`.
- If emergency: `base = next_rung(base)`.
- If `would_breach_stock`: `base = GREATEST(base, 5)`.
- Set `required_level = base`, `submitted_at = now()`,
  `sla_due_at = now() + sla_interval(priority)`, `escalation_count = 0`.
- Open step: `step_number = COALESCE(max,0)+1`, `action='pending'`, `required_level`, `sla_due_at`.
- Notify the responsible tier (`approval_required`).

`escalate_overdue_approvals()` (SECURITY DEFINER, called by pg_cron):
```
FOR each t IN transfer_orders
    WHERE status='pending_approval' AND now() > sla_due_at AND required_level < 8:
  new_level := next_rung(t.required_level)
  close open step: action='escalated', resolved_at=now()
  UPDATE transfer_orders SET required_level=new_level,
         escalation_count=escalation_count+1,
         sla_due_at = now() + sla_interval(priority)
  open new step at new_level
  notify new tier + creator (approval_escalation)
```
If already at `dg(8)` and overdue, it stays at DG (no further escalation; surfaced as an
`overdue-approval` badge in UI).

Authority guard — `BEFORE UPDATE` trigger on `transfer_orders`:
- When `NEW.status = 'approved'` and `OLD.status = 'pending_approval'`: raise unless
  `is_approver_role(current_user_role())` AND `role_level(current_user_role()) >= OLD.required_level`.
- When `NEW.status = 'rejected'`: raise unless the actor is an eligible approver for the current
  rung (same check) — only someone who could approve may reject. `rejection_reason` must be non-null.
- Runs before existing `reserve_stock_on_approval`; ordering verified by trigger name.

Manual escalate and approve/reject are issued via server actions (below) which also write the
`transfer_approval_steps` rows; the DB guard is the backstop for authority.

## Authorization Enforcement

Two layers:
1. **Postgres triggers** (source of truth) — the authority guard above. Cannot be bypassed by any
   client.
2. **UI gating** (UX) — `canApproveTransfer` continues to decide which buttons render.

Approve / reject / manual-escalate move into server actions at
`app/(dashboard)/transfers/[id]/actions.ts`, mirroring the existing `app/(dashboard)/users/actions.ts`
pattern (server-side Supabase client, `revalidatePath`). Server actions own step bookkeeping; the
edge `create-transfer` function continues to create the order and the first submit transition can
be handled by the submit trigger so all paths share one code path.

`lib/auth.ts` additions (pure, unit-tested in `lib/auth.test.ts`):
- `APPROVER_LADDER: UserRole[]` and `requiredLevelForScale(scale)`.
- `canApproveAtLevel(role, requiredLevel): boolean`.
- `nextRung(level)` mirror of the SQL helper (for UI projection of "who's next").
- `canRejectTransfer(role, requiredLevel)` = same as approve eligibility.
- `canEscalateTransfer(role, requiredLevel)` = same as approve eligibility.

## UI

- `components/transfers/transfer-actions.tsx`
  - Approve uses the transfer's current `required_level` (not just `scale`).
  - **Reject** button → reason dialog (required) → server action.
  - **Escalate** button → reason dialog → server action.
  - Header shows: current required tier (role label), SLA countdown from `sla_due_at`, and an
    escalation badge when `escalation_count > 0`.
  - On `rejected`, the creator sees **Edit & Resubmit** and **Cancel**.
- `components/transfers/transfer-timeline.tsx`
  - Render `transfer_approval_steps` as the command chain: rung tier, actor, action, timestamp,
    reason. Pending rung highlighted with countdown.
- `components/transfers/transfer-list.tsx`
  - `escalated` and `overdue-approval` badges; filter by escalation state.
- `types/index.ts`
  - Add the new `transfer_orders` columns, `TransferApprovalStep`, `approval_action`,
    and `rejected` to `TransferStatus`.

## Notifications

- `approval_required` — to the responsible tier on submit and on each escalation.
- `approval_escalation` — to the higher tier and the creator when a rung escalates.
- Emergency-priority transfers additionally send SMS via the existing `send-sms` edge function to
  the responsible tier.

Recipient resolution reuses the role/region/warehouse joins from `evaluate_stock_alerts`.

## Migrations (new files, append to existing numbering)

1. `00014_transfer_status_rejected.sql` — add `rejected` enum value (standalone).
2. `00015_approval_chain_schema.sql` — new columns, `approval_action` type,
   `transfer_approval_steps`, `approval_sla_config` + seed.
3. `00016_approval_chain_functions.sql` — helpers, submit logic, authority guard,
   `escalate_overdue_approvals`, notification emit.
4. `00017_approval_chain_rls.sql` — RLS for `transfer_approval_steps` (read: anyone who can read
   the parent transfer; write: SECURITY DEFINER functions only), `approval_sla_config` (read all,
   write `canConfigureThresholds` roles).
5. `00018_pg_cron_escalation.sql` — enable `pg_cron`, schedule
   `escalate_overdue_approvals()` every 5 minutes.

## Testing

- `lib/auth.test.ts` — `requiredLevelForScale`, `canApproveAtLevel`, `nextRung`,
  `canRejectTransfer`, `canEscalateTransfer` across all roles and scales (incl. auditor excluded,
  sysadmin always passes, cap at dg).
- SQL-level checks (documented manual / seed-based): emergency start-high, stock-risk bump,
  SLA escalation moves one rung and reopens a step, authority guard rejects an under-level approver,
  reject→resubmit resets `required_level` and opens a fresh step.

## Open Parameters (confirm or accept defaults)

- SLA windows: emergency 1h / urgent 4h / routine 24h.
- Scale qty thresholds: unchanged (100 / 500 / 2000).
- Emergency start-high = exactly one rung above scale tier.
- Stock-risk floor = hq_logistics (5).
