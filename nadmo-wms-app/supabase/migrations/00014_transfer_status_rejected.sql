-- Migration: add 'rejected' value to transfer_status enum.
-- Must be its own migration: a new enum value cannot be used in the same
-- transaction that adds it.
ALTER TYPE public.transfer_status ADD VALUE IF NOT EXISTS 'rejected';
