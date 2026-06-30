-- Phase 1b: region-aware oversight RLS + summary views.
-- RUN THIS AFTER 00011 has been committed (it adds the 'hq_admin' enum value).
-- All statements are additive; existing policies are left in place (OR semantics).

-- ============================================================
-- Helper: region ids the current user oversees
-- (regional managers, via the region_id of their assigned warehouses)
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_oversight_region_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT w.region_id
  FROM public.user_warehouses uw
  JOIN public.warehouses w ON w.id = uw.warehouse_id
  WHERE uw.user_id = auth.uid() AND w.region_id IS NOT NULL;
$$;

-- ============================================================
-- National oversight read access for hq_admin (additive)
-- ============================================================
DROP POLICY IF EXISTS "hq_admin national read inventory" ON public.inventory;
CREATE POLICY "hq_admin national read inventory" ON public.inventory
  FOR SELECT TO authenticated USING (public.current_user_role() = 'hq_admin');

DROP POLICY IF EXISTS "hq_admin national read inv tx" ON public.inventory_transactions;
CREATE POLICY "hq_admin national read inv tx" ON public.inventory_transactions
  FOR SELECT TO authenticated USING (public.current_user_role() = 'hq_admin');

DROP POLICY IF EXISTS "hq_admin national read transfers" ON public.transfer_orders;
CREATE POLICY "hq_admin national read transfers" ON public.transfer_orders
  FOR SELECT TO authenticated USING (public.current_user_role() = 'hq_admin');

DROP POLICY IF EXISTS "hq_admin national read transfer items" ON public.transfer_items;
CREATE POLICY "hq_admin national read transfer items" ON public.transfer_items
  FOR SELECT TO authenticated USING (public.current_user_role() = 'hq_admin');

DROP POLICY IF EXISTS "hq_admin read profiles" ON public.profiles;
CREATE POLICY "hq_admin read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.current_user_role() = 'hq_admin');

DROP POLICY IF EXISTS "hq_admin read user_warehouses" ON public.user_warehouses;
CREATE POLICY "hq_admin read user_warehouses" ON public.user_warehouses
  FOR SELECT TO authenticated USING (public.current_user_role() = 'hq_admin');

-- ============================================================
-- Region-aware read for regional managers (uses region_id, so it covers
-- the regional warehouse itself AND every district warehouse in-region)
-- ============================================================
DROP POLICY IF EXISTS "regional region read inventory" ON public.inventory;
CREATE POLICY "regional region read inventory" ON public.inventory
  FOR SELECT TO authenticated USING (
    public.current_user_role() = 'regional_manager'
    AND EXISTS (
      SELECT 1 FROM public.warehouses w
      WHERE w.id = inventory.warehouse_id
        AND w.region_id IN (SELECT public.user_oversight_region_ids())
    )
  );

DROP POLICY IF EXISTS "regional region read transfers" ON public.transfer_orders;
CREATE POLICY "regional region read transfers" ON public.transfer_orders
  FOR SELECT TO authenticated USING (
    public.current_user_role() = 'regional_manager'
    AND (
      EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = transfer_orders.source_warehouse_id
              AND w.region_id IN (SELECT public.user_oversight_region_ids()))
      OR
      EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = transfer_orders.destination_warehouse_id
              AND w.region_id IN (SELECT public.user_oversight_region_ids()))
    )
  );

-- ============================================================
-- Summary views (security_invoker -> each caller only sees what RLS allows)
-- ============================================================
CREATE OR REPLACE VIEW public.v_warehouse_stock_summary
WITH (security_invoker = on) AS
SELECT
  w.id            AS warehouse_id,
  w.name          AS warehouse_name,
  w.type          AS warehouse_type,
  w.region_id     AS region_id,
  w.status        AS status,
  w.capacity_m3   AS capacity_m3,
  COALESCE(SUM(i.quantity), 0)                 AS total_quantity,
  COALESCE(SUM(i.available_quantity), 0)       AS available_quantity,
  COUNT(DISTINCT i.sku_id)                     AS distinct_skus,
  COALESCE(SUM(i.quantity * s.volume_m3), 0)   AS used_volume_m3
FROM public.warehouses w
LEFT JOIN public.inventory i ON i.warehouse_id = w.id
LEFT JOIN public.skus s ON s.id = i.sku_id
GROUP BY w.id;

CREATE OR REPLACE VIEW public.v_region_stock_summary
WITH (security_invoker = on) AS
SELECT
  r.id   AS region_id,
  r.code AS region_code,
  r.name AS region_name,
  COUNT(DISTINCT w.id)                    AS warehouse_count,
  COALESCE(SUM(i.quantity), 0)            AS total_quantity,
  COALESCE(SUM(i.available_quantity), 0)  AS available_quantity
FROM public.regions r
LEFT JOIN public.warehouses w ON w.region_id = r.id
LEFT JOIN public.inventory i ON i.warehouse_id = w.id
GROUP BY r.id;

GRANT SELECT ON public.v_warehouse_stock_summary TO authenticated;
GRANT SELECT ON public.v_region_stock_summary TO authenticated;
