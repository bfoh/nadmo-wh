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
