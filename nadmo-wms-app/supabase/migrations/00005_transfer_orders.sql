-- Migration: Transfer Orders and Items

CREATE TYPE public.transfer_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'ready_for_dispatch',
    'in_transit',
    'received',
    'discrepancy',
    'cancelled',
    'overdue'
);

CREATE TYPE public.transfer_priority AS ENUM (
    'routine',
    'urgent',
    'emergency'
);

CREATE TYPE public.transfer_scale AS ENUM (
    'routine',
    'standard',
    'large',
    'strategic'
);

CREATE TYPE public.item_condition AS ENUM (
    'good',
    'damaged',
    'expired',
    'missing'
);

CREATE TABLE IF NOT EXISTS public.transfer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number VARCHAR(30) UNIQUE NOT NULL,
    source_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    destination_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    status public.transfer_status NOT NULL DEFAULT 'draft',
    priority public.transfer_priority NOT NULL DEFAULT 'routine',
    scale public.transfer_scale NOT NULL DEFAULT 'routine',
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    vehicle_registration VARCHAR(20),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    dispatcher_id UUID REFERENCES public.profiles(id),
    dispatched_at TIMESTAMPTZ,
    received_by UUID REFERENCES public.profiles(id),
    received_at TIMESTAMPTZ,
    expected_delivery_at TIMESTAMPTZ,
    actual_delivery_at TIMESTAMPTZ,
    digital_signature TEXT,
    signature_data TEXT,
    notes TEXT,
    discrepancy_reason TEXT,
    discrepancy_photos TEXT[],
    CHECK (source_warehouse_id != destination_warehouse_id)
);

COMMENT ON TABLE public.transfer_orders IS 'Inter-warehouse transfer orders and waybills';

CREATE TABLE IF NOT EXISTS public.transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.transfer_orders(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES public.skus(id),
    batch_lot VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    quantity_dispatched INTEGER NOT NULL CHECK (quantity_dispatched > 0),
    quantity_received INTEGER CHECK (quantity_received >= 0),
    condition public.item_condition DEFAULT 'good',
    notes TEXT,
    UNIQUE(transfer_id, sku_id, batch_lot)
);

COMMENT ON TABLE public.transfer_items IS 'Line items within a transfer order';

CREATE INDEX IF NOT EXISTS idx_transfer_orders_source ON public.transfer_orders(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_destination ON public.transfer_orders(destination_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_status ON public.transfer_orders(status);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_created_at ON public.transfer_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer_id ON public.transfer_items(transfer_id);

CREATE TRIGGER transfer_orders_updated_at
    BEFORE UPDATE ON public.transfer_orders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
