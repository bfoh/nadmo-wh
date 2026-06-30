-- Migration: receipt & discrepancy schema

CREATE TYPE public.discrepancy_status AS ENUM ('none', 'open', 'resolved');

ALTER TABLE public.transfer_orders
  ADD COLUMN IF NOT EXISTS discrepancy_status public.discrepancy_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS discrepancy_resolved_by   UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS discrepancy_resolved_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discrepancy_resolution_note TEXT;
