-- Migration: Row-Level Security Policies

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
DECLARE
    user_role public.user_role;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is assigned to a warehouse
CREATE OR REPLACE FUNCTION public.user_has_warehouse(p_warehouse_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_warehouses
        WHERE user_id = auth.uid() AND warehouse_id = p_warehouse_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if warehouse is in user's region
CREATE OR REPLACE FUNCTION public.user_has_region_by_warehouse(p_warehouse_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.warehouses w
        JOIN public.districts d ON w.district_id = d.id
        JOIN public.user_warehouses uw ON uw.warehouse_id = w.id
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE w.id = p_warehouse_id
        AND (
            p.role IN ('dg', 'hq_logistics', 'hq_procurement', 'auditor', 'sysadmin')
            OR EXISTS (
                SELECT 1 FROM public.warehouses w2
                JOIN public.districts d2 ON w2.district_id = d2.id
                JOIN public.user_warehouses uw2 ON uw2.warehouse_id = w2.id
                WHERE uw2.user_id = auth.uid()
                AND d2.region_id = d.region_id
                AND p.role = 'regional_manager'
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ========== REGIONS ==========
CREATE POLICY "Regions readable by authenticated users"
    ON public.regions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Regions manageable by sysadmin and dg"
    ON public.regions FOR ALL
    TO authenticated
    USING (public.current_user_role() IN ('sysadmin', 'dg'));

-- ========== DISTRICTS ==========
CREATE POLICY "Districts readable by authenticated users"
    ON public.districts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Districts manageable by sysadmin and dg"
    ON public.districts FOR ALL
    TO authenticated
    USING (public.current_user_role() IN ('sysadmin', 'dg'));

-- ========== WAREHOUSES ==========
CREATE POLICY "Warehouses readable by authenticated users"
    ON public.warehouses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Warehouses manageable by sysadmin, dg, hq"
    ON public.warehouses FOR ALL
    TO authenticated
    USING (public.current_user_role() IN ('sysadmin', 'dg', 'hq_logistics', 'hq_procurement'));

-- ========== SKU CATEGORIES ==========
CREATE POLICY "SKU categories readable by authenticated users"
    ON public.sku_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "SKU categories manageable by sysadmin and hq"
    ON public.sku_categories FOR ALL
    TO authenticated
    USING (public.current_user_role() IN ('sysadmin', 'hq_logistics', 'hq_procurement'));

-- ========== SKUS ==========
CREATE POLICY "SKUs readable by authenticated users"
    ON public.skus FOR SELECT
    TO authenticated
    USING (is_active = true OR public.current_user_role() IN ('sysadmin', 'hq_logistics', 'hq_procurement'));

CREATE POLICY "SKUs manageable by sysadmin and hq"
    ON public.skus FOR ALL
    TO authenticated
    USING (public.current_user_role() IN ('sysadmin', 'hq_logistics', 'hq_procurement'));

-- ========== PROFILES ==========
CREATE POLICY "Profiles readable by own user or privileged roles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR public.current_user_role() IN ('sysadmin', 'dg', 'auditor')
    );

CREATE POLICY "Profiles manageable by sysadmin and dg"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.current_user_role() IN ('sysadmin', 'dg'));

CREATE POLICY "Users can update own profile basic info"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ========== USER WAREHOUSES ==========
CREATE POLICY "User warehouses readable by own user or privileged roles"
    ON public.user_warehouses FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.current_user_role() IN ('sysadmin', 'dg', 'auditor')
    );

CREATE POLICY "User warehouses manageable by sysadmin and dg"
    ON public.user_warehouses FOR ALL
    TO authenticated
    USING (public.current_user_role() IN ('sysadmin', 'dg'));

-- ========== INVENTORY ==========
CREATE POLICY "Inventory readable by assigned or privileged users"
    ON public.inventory FOR SELECT
    TO authenticated
    USING (
        public.user_has_warehouse(warehouse_id)
        OR public.current_user_role() IN ('dg', 'hq_logistics', 'hq_procurement', 'auditor', 'sysadmin')
        OR (
            public.current_user_role() = 'regional_manager'
            AND EXISTS (
                SELECT 1 FROM public.warehouses w
                JOIN public.districts d ON w.district_id = d.id
                JOIN public.user_warehouses uw ON uw.warehouse_id = w.id
                JOIN public.profiles p ON p.id = auth.uid()
                WHERE w.id = inventory.warehouse_id
                AND EXISTS (
                    SELECT 1 FROM public.warehouses w2
                    JOIN public.districts d2 ON w2.district_id = d2.id
                    WHERE w2.id = uw.warehouse_id AND d2.region_id = d.region_id
                )
            )
        )
    );

CREATE POLICY "Inventory writable by assigned district/hq users"
    ON public.inventory FOR ALL
    TO authenticated
    USING (
        public.current_user_role() IN ('sysadmin', 'hq_logistics', 'hq_procurement')
        OR (
            public.user_has_warehouse(warehouse_id)
            AND public.current_user_role() IN ('district_officer', 'field_officer')
        )
    );

-- ========== INVENTORY TRANSACTIONS ==========
CREATE POLICY "Inventory transactions readable by assigned or privileged users"
    ON public.inventory_transactions FOR SELECT
    TO authenticated
    USING (
        public.user_has_warehouse(warehouse_id)
        OR public.current_user_role() IN ('dg', 'hq_logistics', 'hq_procurement', 'auditor', 'sysadmin')
    );

CREATE POLICY "Inventory transactions insertable by system or authorised users"
    ON public.inventory_transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        public.user_has_warehouse(warehouse_id)
        OR public.current_user_role() IN ('sysadmin', 'hq_logistics', 'hq_procurement')
    );

-- ========== TRANSFER ORDERS ==========
CREATE POLICY "Transfer orders readable by involved or privileged users"
    ON public.transfer_orders FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('dg', 'hq_logistics', 'hq_procurement', 'auditor', 'sysadmin')
        OR public.user_has_warehouse(source_warehouse_id)
        OR public.user_has_warehouse(destination_warehouse_id)
        OR created_by = auth.uid()
    );

CREATE POLICY "Transfer orders creatable by authorised users"
    ON public.transfer_orders FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_user_role() IN ('dg', 'hq_logistics', 'hq_procurement', 'regional_manager')
        OR public.user_has_warehouse(source_warehouse_id)
    );

CREATE POLICY "Transfer orders updatable by authorised users"
    ON public.transfer_orders FOR UPDATE
    TO authenticated
    USING (
        public.current_user_role() IN ('dg', 'hq_logistics', 'hq_procurement', 'sysadmin')
        OR public.user_has_warehouse(source_warehouse_id)
        OR public.user_has_warehouse(destination_warehouse_id)
    );

-- ========== TRANSFER ITEMS ==========
CREATE POLICY "Transfer items readable with transfer order permission"
    ON public.transfer_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.transfer_orders t
            WHERE t.id = transfer_items.transfer_id
            AND (
                public.current_user_role() IN ('dg', 'hq_logistics', 'hq_procurement', 'auditor', 'sysadmin')
                OR public.user_has_warehouse(t.source_warehouse_id)
                OR public.user_has_warehouse(t.destination_warehouse_id)
                OR t.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Transfer items writable with transfer order permission"
    ON public.transfer_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.transfer_orders t
            WHERE t.id = transfer_items.transfer_id
            AND (
                public.current_user_role() IN ('dg', 'hq_logistics', 'hq_procurement', 'sysadmin')
                OR public.user_has_warehouse(t.source_warehouse_id)
                OR public.user_has_warehouse(t.destination_warehouse_id)
            )
        )
    );

-- ========== WAREHOUSE THRESHOLDS ==========
CREATE POLICY "Thresholds readable by authenticated users"
    ON public.warehouse_thresholds FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Thresholds manageable by sysadmin, dg, hq, regional manager"
    ON public.warehouse_thresholds FOR ALL
    TO authenticated
    USING (
        public.current_user_role() IN ('sysadmin', 'dg', 'hq_logistics', 'hq_procurement')
        OR (
            public.current_user_role() = 'regional_manager'
            AND region_id IS NOT NULL
        )
    );

-- ========== AUDIT LOGS ==========
CREATE POLICY "Audit logs readable by privileged roles"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.current_user_role() IN ('sysadmin', 'dg', 'auditor'));

CREATE POLICY "Audit logs insertable by authenticated users"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Prevent update/delete on audit logs at application level as well
CREATE POLICY "Audit logs not updatable or deletable"
    ON public.audit_logs FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY "Audit logs not deletable"
    ON public.audit_logs FOR DELETE
    TO authenticated
    USING (false);

-- ========== NOTIFICATIONS ==========
CREATE POLICY "Notifications readable by own user"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Notifications manageable by system"
    ON public.notifications FOR ALL
    TO authenticated
    USING (user_id = auth.uid());
