-- Phase 5: threshold-aware stock health.
-- Per (warehouse, category) available stock vs the effective threshold, with a
-- RAG status. Effective threshold precedence: warehouse-specific > regional > global.
-- security_invoker so each caller only sees warehouses their RLS permits.

CREATE OR REPLACE VIEW public.v_warehouse_category_health
WITH (security_invoker = on) AS
SELECT
  w.id          AS warehouse_id,
  w.name        AS warehouse_name,
  w.region_id   AS region_id,
  c.id          AS category_id,
  c.name        AS category_name,
  COALESCE(SUM(i.available_quantity), 0) AS available,
  th.min_quantity,
  th.amber_multiplier,
  CASE
    WHEN th.min_quantity IS NULL THEN 'unset'
    WHEN COALESCE(SUM(i.available_quantity), 0) <= th.min_quantity THEN 'critical'
    WHEN COALESCE(SUM(i.available_quantity), 0) <= th.min_quantity * th.amber_multiplier THEN 'amber'
    ELSE 'ok'
  END AS status
FROM public.warehouses w
CROSS JOIN public.sku_categories c
LEFT JOIN public.skus s ON s.category_id = c.id
LEFT JOIN public.inventory i ON i.warehouse_id = w.id AND i.sku_id = s.id
LEFT JOIN LATERAL (
  SELECT t.min_quantity, t.amber_multiplier
  FROM public.warehouse_thresholds t
  WHERE t.sku_category_id = c.id
    AND (
      t.warehouse_id = w.id
      OR (t.warehouse_id IS NULL AND t.region_id = w.region_id)
      OR (t.warehouse_id IS NULL AND t.region_id IS NULL)
    )
  ORDER BY (t.warehouse_id IS NOT NULL) DESC, (t.region_id IS NOT NULL) DESC
  LIMIT 1
) th ON true
-- Only assess warehouses that actually hold stock; an empty (never-stocked)
-- warehouse is "not yet stocked", not "critically low".
WHERE EXISTS (SELECT 1 FROM public.inventory inv WHERE inv.warehouse_id = w.id)
GROUP BY w.id, w.name, w.region_id, c.id, c.name, th.min_quantity, th.amber_multiplier;

GRANT SELECT ON public.v_warehouse_category_health TO authenticated;
