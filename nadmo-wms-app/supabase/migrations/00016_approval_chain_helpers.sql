-- Migration: approval-chain helper functions

-- Role → hierarchy level (mirror of ROLE_HIERARCHY in lib/auth.ts)
CREATE OR REPLACE FUNCTION public.role_level(p_role public.user_role)
RETURNS SMALLINT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_role
    WHEN 'readonly' THEN 0
    WHEN 'field_officer' THEN 1
    WHEN 'district_officer' THEN 2
    WHEN 'regional_manager' THEN 3
    WHEN 'hq_procurement' THEN 4
    WHEN 'hq_logistics' THEN 5
    WHEN 'hq_admin' THEN 6
    WHEN 'auditor' THEN 7
    WHEN 'dg' THEN 8
    WHEN 'sysadmin' THEN 9
  END::SMALLINT;
$$;

-- Approver tiers = ladder roles + sysadmin
CREATE OR REPLACE FUNCTION public.is_approver_role(p_role public.user_role)
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE AS $$
  SELECT p_role IN ('district_officer','regional_manager','hq_logistics','dg','sysadmin');
$$;

CREATE OR REPLACE FUNCTION public.scale_required_level(p_scale public.transfer_scale)
RETURNS SMALLINT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_scale
    WHEN 'routine' THEN 2
    WHEN 'standard' THEN 3
    WHEN 'large' THEN 5
    WHEN 'strategic' THEN 8
  END::SMALLINT;
$$;

-- Next ladder rung strictly above p_level, capped at dg(8)
CREATE OR REPLACE FUNCTION public.next_rung(p_level SMALLINT)
RETURNS SMALLINT LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
    (SELECT l FROM (VALUES (2::SMALLINT),(3),(5),(8)) AS rungs(l) WHERE l > p_level ORDER BY l LIMIT 1),
    8::SMALLINT
  );
$$;

-- Ladder level → the role that sits on that rung
CREATE OR REPLACE FUNCTION public.role_for_level(p_level SMALLINT)
RETURNS public.user_role LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_level
    WHEN 2 THEN 'district_officer'
    WHEN 3 THEN 'regional_manager'
    WHEN 5 THEN 'hq_logistics'
    WHEN 8 THEN 'dg'
  END::public.user_role;
$$;

CREATE OR REPLACE FUNCTION public.sla_interval(p_priority public.transfer_priority)
RETURNS INTERVAL LANGUAGE sql STABLE AS $$
  SELECT (COALESCE(
    (SELECT window_hours FROM public.approval_sla_config WHERE priority = p_priority),
    24
  ) || ' hours')::INTERVAL;
$$;

-- True if approving would drop any source line at/below its applicable min threshold
CREATE OR REPLACE FUNCTION public.would_breach_stock(p_transfer_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.transfer_items ti
    JOIN public.transfer_orders t ON t.id = ti.transfer_id
    JOIN public.skus s ON s.id = ti.sku_id
    JOIN public.inventory inv
      ON inv.warehouse_id = t.source_warehouse_id
     AND inv.sku_id = ti.sku_id
     AND inv.batch_lot = ti.batch_lot
    LEFT JOIN LATERAL (
      SELECT wt.min_quantity
      FROM public.warehouse_thresholds wt
      WHERE wt.sku_category_id = s.category_id
        AND (wt.warehouse_id = t.source_warehouse_id
             OR (wt.warehouse_id IS NULL AND wt.region_id IS NULL))
      ORDER BY CASE WHEN wt.warehouse_id IS NOT NULL THEN 0 ELSE 1 END
      LIMIT 1
    ) thr ON TRUE
    WHERE ti.transfer_id = p_transfer_id
      AND thr.min_quantity IS NOT NULL
      AND (inv.available_quantity - ti.quantity_dispatched) <= thr.min_quantity
  );
$$;

-- Notify every active user holding the role on rung p_level, scoped to the
-- transfer's source warehouse/region where the role is geographic.
CREATE OR REPLACE FUNCTION public.notify_approval_tier(
  p_transfer_id UUID,
  p_level SMALLINT,
  p_type public.notification_type,
  p_title VARCHAR(200),
  p_message TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.user_role := public.role_for_level(p_level);
  v_source UUID;
  v_region UUID;
  v_uid UUID;
BEGIN
  SELECT source_warehouse_id INTO v_source FROM public.transfer_orders WHERE id = p_transfer_id;
  SELECT d.region_id INTO v_region
  FROM public.warehouses w JOIN public.districts d ON d.id = w.district_id
  WHERE w.id = v_source;

  FOR v_uid IN
    SELECT DISTINCT p.id
    FROM public.profiles p
    LEFT JOIN public.user_warehouses uw ON uw.user_id = p.id
    LEFT JOIN public.warehouses w ON w.id = uw.warehouse_id
    LEFT JOIN public.districts d ON d.id = w.district_id
    WHERE p.role = v_role
      AND p.is_active
      AND (
        v_role IN ('hq_logistics','dg')          -- national roles: notify all
        OR (v_role = 'district_officer' AND uw.warehouse_id = v_source)
        OR (v_role = 'regional_manager' AND d.region_id = v_region)
      )
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
    VALUES (v_uid, p_type, p_title, p_message, 'transfer_order', p_transfer_id);
  END LOOP;
END;
$$;
