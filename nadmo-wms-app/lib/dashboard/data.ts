import type { SupabaseClient } from '@supabase/supabase-js';
import type { Scope } from '@/lib/scope';

const NONE = '00000000-0000-0000-0000-000000000000';

export interface WarehouseSummary {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_type: 'hq' | 'regional' | 'district';
  region_id: string | null;
  status: 'operational' | 'limited' | 'closed';
  capacity_m3: number | null;
  total_quantity: number;
  available_quantity: number;
  distinct_skus: number;
  used_volume_m3: number;
}

export interface RegionSummary {
  region_id: string;
  region_code: string;
  region_name: string;
  warehouse_count: number;
  total_quantity: number;
  available_quantity: number;
}

export interface DashboardKpis {
  warehouses: number;
  inTransit: number;
  availableUnits: number;
  lowStock: number;
  critical: number;
}

export interface StockAlertRow {
  warehouse_id: string;
  warehouse_name: string;
  category_name: string;
  status: 'critical' | 'amber';
  available: number;
  min_quantity: number;
}

export interface StockHealth {
  alerts: StockAlertRow[];
  criticalCount: number;
  lowCount: number;
}

export interface ScopeFilter {
  warehouseIds?: string[];
  regionIds?: string[];
}

/** Per-warehouse stock summary, filtered to the caller's scope. */
export async function getWarehouseSummaries(
  supabase: SupabaseClient,
  scope: Scope
): Promise<WarehouseSummary[]> {
  let query = supabase.from('v_warehouse_stock_summary').select('*');

  if (scope.level === 'warehouse') {
    query = query.in('warehouse_id', scope.warehouseIds.length ? scope.warehouseIds : [NONE]);
  } else if (scope.level === 'regional') {
    query = query.in('region_id', scope.regionIds.length ? scope.regionIds : [NONE]);
  }

  const { data } = await query;
  return (data ?? []) as WarehouseSummary[];
}

/** Per-region rollup (national sees all regions; regional sees its own). */
export async function getRegionSummaries(
  supabase: SupabaseClient,
  scope: Scope
): Promise<RegionSummary[]> {
  let query = supabase.from('v_region_stock_summary').select('*');
  if (scope.level === 'regional') {
    query = query.in('region_id', scope.regionIds.length ? scope.regionIds : [NONE]);
  }
  const { data } = await query;
  return ((data ?? []) as RegionSummary[]).sort((a, b) => b.total_quantity - a.total_quantity);
}

/** Pure stock KPIs from a set of warehouse summaries. */
export function computeStockKpis(summaries: WarehouseSummary[]) {
  const warehouses = summaries.filter((w) => w.status === 'operational').length;
  const availableUnits = summaries.reduce((sum, w) => sum + Number(w.available_quantity || 0), 0);
  const usedVolume = summaries.reduce((sum, w) => sum + Number(w.used_volume_m3 || 0), 0);
  const capacity = summaries.reduce((sum, w) => sum + Number(w.capacity_m3 || 0), 0);
  const capacityPct = capacity > 0 ? Math.round((usedVolume / capacity) * 100) : 0;
  return { warehouses, availableUnits, capacityPct };
}

/** In-transit transfer count — for one warehouse, or RLS-scoped to the caller. */
export async function getInTransitCount(
  supabase: SupabaseClient,
  warehouseId?: string
): Promise<number> {
  let query = supabase
    .from('transfer_orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['in_transit', 'ready_for_dispatch']);
  if (warehouseId) {
    query = query.or(
      `source_warehouse_id.eq.${warehouseId},destination_warehouse_id.eq.${warehouseId}`
    );
  }
  const { count } = await query;
  return count ?? 0;
}

/** Threshold-aware stock health (critical/amber category alerts) for a scope. */
export async function getStockHealth(
  supabase: SupabaseClient,
  filter: ScopeFilter
): Promise<StockHealth> {
  let query = supabase
    .from('v_warehouse_category_health')
    .select('warehouse_id, warehouse_name, category_name, status, available, min_quantity')
    .in('status', ['critical', 'amber']);

  if (filter.warehouseIds) {
    query = query.in('warehouse_id', filter.warehouseIds.length ? filter.warehouseIds : [NONE]);
  } else if (filter.regionIds) {
    query = query.in('region_id', filter.regionIds.length ? filter.regionIds : [NONE]);
  }

  const { data } = await query;
  const rows = (data ?? []) as StockAlertRow[];
  rows.sort((a, b) =>
    a.status === b.status ? a.available - b.available : a.status === 'critical' ? -1 : 1
  );
  const criticalCount = rows.filter((r) => r.status === 'critical').length;
  return { alerts: rows.slice(0, 50), criticalCount, lowCount: rows.length };
}

/** Builds the KPI tile data for a scope from summaries + transfers + health. */
export async function getKpiData(
  supabase: SupabaseClient,
  summaries: WarehouseSummary[],
  health: StockHealth,
  warehouseId?: string
): Promise<DashboardKpis> {
  const stock = computeStockKpis(summaries);
  const inTransit = await getInTransitCount(supabase, warehouseId);
  return {
    warehouses: stock.warehouses,
    availableUnits: stock.availableUnits,
    inTransit,
    lowStock: health.lowCount,
    critical: health.criticalCount,
  };
}

/** Transfers awaiting approval that are visible to the caller (RLS-scoped),
 *  most SLA-urgent first. */
export async function getPendingApprovals(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('transfer_orders')
    .select(
      '*, source_warehouse:source_warehouse_id(name), destination_warehouse:destination_warehouse_id(name)'
    )
    .eq('status', 'pending_approval')
    .order('sla_due_at', { ascending: true, nullsFirst: false })
    .limit(25);
  return data ?? [];
}

/** Recent transfers involving a specific warehouse (source or destination). */
export async function getWarehouseRecentTransfers(
  supabase: SupabaseClient,
  warehouseId: string
) {
  const { data } = await supabase
    .from('transfer_orders')
    .select(
      '*, source_warehouse:source_warehouse_id(name), destination_warehouse:destination_warehouse_id(name)'
    )
    .or(`source_warehouse_id.eq.${warehouseId},destination_warehouse_id.eq.${warehouseId}`)
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

export interface HierWarehouse {
  id: string;
  name: string;
  type: 'hq' | 'regional' | 'district';
  available: number;
  capacityPct: number | null;
}

export interface HierRegion {
  id: string;
  name: string;
  available: number;
  total: number;
  warehouses: HierWarehouse[];
}

/** Builds the National -> Region -> Warehouse tree for the drill-down widget. */
export function buildHierarchy(
  regions: RegionSummary[],
  warehouses: WarehouseSummary[]
): { regions: HierRegion[]; national: HierWarehouse[] } {
  const byRegion = new Map<string, HierWarehouse[]>();
  const national: HierWarehouse[] = [];

  for (const w of warehouses) {
    const hw: HierWarehouse = {
      id: w.warehouse_id,
      name: w.warehouse_name,
      type: w.warehouse_type,
      available: Number(w.available_quantity || 0),
      capacityPct:
        w.capacity_m3 && Number(w.capacity_m3) > 0
          ? Math.min(100, Math.round((Number(w.used_volume_m3) / Number(w.capacity_m3)) * 100))
          : null,
    };
    if (w.region_id) {
      const list = byRegion.get(w.region_id) ?? [];
      list.push(hw);
      byRegion.set(w.region_id, list);
    } else {
      national.push(hw);
    }
  }

  const regionNodes: HierRegion[] = regions
    .filter((r) => (byRegion.get(r.region_id)?.length ?? 0) > 0)
    .map((r) => ({
      id: r.region_id,
      name: r.region_name,
      available: Number(r.available_quantity || 0),
      total: Number(r.total_quantity || 0),
      warehouses: (byRegion.get(r.region_id) ?? []).sort((a, b) => b.available - a.available),
    }));

  return { regions: regionNodes, national };
}

/** Recent transfer activity visible to the caller (RLS scopes it). */
export async function getRecentTransfers(supabase: SupabaseClient, _scope: Scope) {
  const { data } = await supabase
    .from('transfer_orders')
    .select(
      '*, source_warehouse:source_warehouse_id(name), destination_warehouse:destination_warehouse_id(name)'
    )
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

/** Region id -> name lookup for display. */
export async function getRegionNameMap(supabase: SupabaseClient): Promise<Map<string, string>> {
  const { data } = await supabase.from('regions').select('id, name');
  return new Map((data ?? []).map((r: any) => [r.id as string, r.name as string]));
}

/** Page heading + subtitle for the current scope. */
export async function getScopeHeading(
  supabase: SupabaseClient,
  scope: Scope
): Promise<{ title: string; subtitle: string }> {
  if (scope.level === 'national') {
    return {
      title: 'National Operations Overview',
      subtitle: 'Real-time visibility across all NADMO warehouses',
    };
  }
  if (scope.level === 'regional') {
    const regionId = scope.regionIds[0];
    const { data } = regionId
      ? await supabase.from('regions').select('name').eq('id', regionId).single()
      : { data: null };
    return {
      title: `${data?.name ?? 'Regional'} Command`,
      subtitle: 'Your regional warehouse and the districts under it',
    };
  }
  const { data } = scope.primaryWarehouseId
    ? await supabase.from('warehouses').select('name').eq('id', scope.primaryWarehouseId).single()
    : { data: null };
  return {
    title: data?.name ?? 'Warehouse Dashboard',
    subtitle: 'Manage your assigned warehouse operations',
  };
}
