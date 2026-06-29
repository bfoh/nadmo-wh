-- Migration: Fix warehouse_thresholds constraint to allow global defaults
-- Global thresholds have both warehouse_id and region_id NULL.

ALTER TABLE public.warehouse_thresholds
DROP CONSTRAINT IF EXISTS warehouse_thresholds_check;

ALTER TABLE public.warehouse_thresholds
ADD CONSTRAINT warehouse_thresholds_check
CHECK (
    NOT (warehouse_id IS NOT NULL AND region_id IS NOT NULL)
);
