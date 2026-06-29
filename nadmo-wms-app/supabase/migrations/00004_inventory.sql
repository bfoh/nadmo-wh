-- Migration: Inventory and Batch Tracking

CREATE TYPE public.inventory_transaction_type AS ENUM (
    'intake',
    'dispatch',
    'adjustment',
    'transfer_in',
    'transfer_out',
    'reservation',
    'release',
    'cycle_count'
);

CREATE TYPE public.adjustment_reason AS ENUM (
    'damage',
    'expiry',
    'correction',
    'write_off',
    'loss',
    'theft',
    'other'
);

CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE RESTRICT,
    batch_lot VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    expiry_date DATE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    storage_location VARCHAR(50),
    last_counted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(warehouse_id, sku_id, batch_lot)
);

COMMENT ON TABLE public.inventory IS 'Current stock balances by warehouse, SKU, and batch/lot';

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE RESTRICT,
    batch_lot VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    transaction_type public.inventory_transaction_type NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_type VARCHAR(50), -- transfer_order, adjustment, etc.
    reference_id UUID,
    reason public.adjustment_reason,
    reason_notes TEXT,
    performed_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.inventory_transactions IS 'Historical record of all inventory movements';

CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON public.inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku_id ON public.inventory(sku_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON public.inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_warehouse_id ON public.inventory_transactions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions(created_at);

CREATE TRIGGER inventory_updated_at
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
