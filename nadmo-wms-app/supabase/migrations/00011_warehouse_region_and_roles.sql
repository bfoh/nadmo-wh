-- Phase 1a: hierarchy keystone + HQ admin role + onboarding flag.
-- RUN THIS FILE FIRST, on its own, then run 00012.
-- (00012 references the new 'hq_admin' enum value, which must be committed first.)

-- 1. New role for HQ administrators.
--    If your SQL editor complains that ALTER TYPE can't run in a transaction,
--    run just this one statement on its own, then run the rest.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'hq_admin';

-- 2. Force-first-login password reset flag (set when an admin creates a user).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT false;

-- 3. region_id on warehouses — the hierarchy keystone.
--    Lets every warehouse (district, regional, HQ) resolve to its region.
ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id);

CREATE INDEX IF NOT EXISTS idx_warehouses_region_id ON public.warehouses(region_id);

-- 4. Backfill region_id.
--    a) District warehouses — authoritative, via their district.
UPDATE public.warehouses w
SET region_id = d.region_id
FROM public.districts d
WHERE w.district_id = d.id
  AND w.region_id IS DISTINCT FROM d.region_id;

--    b) Regional warehouses (and any remaining) — from the region code embedded
--       in the warehouse code, e.g. WH-AS-REG -> region code 'AS'.
UPDATE public.warehouses w
SET region_id = r.id
FROM public.regions r
WHERE w.region_id IS NULL
  AND split_part(w.code, '-', 2) = r.code;

-- HQ (WH-HQ-ACC) intentionally keeps region_id NULL = national scope.
