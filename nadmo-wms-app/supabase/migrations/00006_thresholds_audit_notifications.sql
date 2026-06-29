-- Migration: Thresholds, Audit Logs, and Notifications

-- Warehouse stock thresholds
CREATE TABLE IF NOT EXISTS public.warehouse_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
    sku_category_id UUID NOT NULL REFERENCES public.sku_categories(id) ON DELETE CASCADE,
    min_quantity INTEGER NOT NULL CHECK (min_quantity >= 0),
    amber_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.5 CHECK (amber_multiplier >= 1.0),
    set_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
    set_at TIMESTAMPTZ DEFAULT now(),
    CHECK (
        NOT (warehouse_id IS NOT NULL AND region_id IS NOT NULL)
    )
);

COMMENT ON TABLE public.warehouse_thresholds IS 'Stock level thresholds by warehouse or region';

CREATE INDEX IF NOT EXISTS idx_thresholds_warehouse ON public.warehouse_thresholds(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_thresholds_region ON public.warehouse_thresholds(region_id);
CREATE INDEX IF NOT EXISTS idx_thresholds_category ON public.warehouse_thresholds(sku_category_id);

-- Audit logs (append-only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID UNIQUE DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES public.profiles(id),
    user_role public.user_role,
    warehouse_id UUID REFERENCES public.warehouses(id),
    region_id UUID REFERENCES public.regions(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    previous_hash TEXT,
    entry_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail of all system actions';

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_warehouse_id ON public.audit_logs(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- Notifications
CREATE TYPE public.notification_type AS ENUM (
    'critical_stock',
    'amber_stock',
    'overdue_shipment',
    'discrepancy',
    'approval_required',
    'approval_escalation',
    'transfer_dispatched',
    'transfer_received',
    'expiry_warning',
    'system'
);

CREATE TYPE public.notification_channel AS ENUM (
    'in_app',
    'sms',
    'email'
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    channel public.notification_channel NOT NULL DEFAULT 'in_app',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ,
    external_status VARCHAR(50),
    external_response TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'User notifications across channels';

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
