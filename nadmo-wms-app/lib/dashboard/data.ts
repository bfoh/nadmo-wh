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
  capacityPct: number;
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

/** KPI tiles, derived from the scoped warehouse summaries plus a transfers count. */
export async function getKpis(
  supabase: SupabaseClient,
  _scope: Scope,
  summaries: WarehouseSummary[]
): Promise<DashboardKpis> {
  const warehouses = summaries.filter((w) => w.status === 'operational').length;
  const availableUnits = summaries.reduce((sum, w) => sum + Number(w.available_quantity || 0), 0);
  const usedVolume = summaries.reduce((sum, w) => sum + Number(w.used_volume_m3 || 0), 0);
  const capacity = summaries.reduce((sum, w) => sum + Number(w.capacity_m3 || 0), 0);
  const capacityPct = capacity > 0 ? Math.round((usedVolume / capacity) * 100) : 0;

  // In-transit transfers visible to the caller (RLS already scopes this).
  const { count: inTransit } = await supabase
    .from('transfer_orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['in_transit', 'ready_for_dispatch']);

  return { warehouses, inTransit: inTransit ?? 0, availableUnits, capacityPct };
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
