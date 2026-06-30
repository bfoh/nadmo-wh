import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '@/types';
import { canSeeNational, scopeLevel, type ScopeLevel } from '@/lib/auth';

/**
 * A user's resolved data scope — the single source of truth for what a
 * dashboard query may roll up. Security is still enforced by RLS; this just
 * drives which warehouses/regions a screen aggregates and how it renders.
 *
 * - national  : no warehouse/region filter (RLS already permits all).
 * - regional  : filter aggregates to `regionIds`.
 * - warehouse : filter aggregates to `warehouseIds`.
 */
export interface Scope {
  role: UserRole;
  level: ScopeLevel;
  canSeeNational: boolean;
  /** The warehouse the user primarily operates (for the "My Warehouse" view). */
  primaryWarehouseId: string | null;
  /** Warehouses the user is directly assigned to (operates). */
  warehouseIds: string[];
  /** Regions in the user's oversight set (populated for regional managers). */
  regionIds: string[];
}

interface Assignment {
  warehouse_id: string;
  is_primary: boolean;
  region_id: string | null;
}

/** Pure scope computation — easy to unit test without a DB. */
export function resolveScope(role: UserRole, assignments: Assignment[]): Scope {
  const warehouseIds = assignments.map((a) => a.warehouse_id);
  const regionIds = Array.from(
    new Set(assignments.map((a) => a.region_id).filter((id): id is string => !!id))
  );
  const primaryWarehouseId =
    assignments.find((a) => a.is_primary)?.warehouse_id ?? warehouseIds[0] ?? null;

  return {
    role,
    level: scopeLevel(role),
    canSeeNational: canSeeNational(role),
    primaryWarehouseId,
    warehouseIds,
    regionIds,
  };
}

/** Loads a user's profile assignments and resolves their scope. */
export async function loadScope(
  supabase: SupabaseClient,
  userId: string
): Promise<Scope | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (!profile) return null;

  const { data: rows } = await supabase
    .from('user_warehouses')
    .select('warehouse_id, is_primary, warehouse:warehouse_id(region_id)')
    .eq('user_id', userId);

  const assignments: Assignment[] = (rows ?? []).map((r: any) => ({
    warehouse_id: r.warehouse_id,
    is_primary: r.is_primary,
    region_id: r.warehouse?.region_id ?? null,
  }));

  return resolveScope(profile.role as UserRole, assignments);
}
