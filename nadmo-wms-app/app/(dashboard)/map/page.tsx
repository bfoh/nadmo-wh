import { createClient } from '@/lib/supabase/server';
import { loadScope } from '@/lib/scope';
import { getWarehouseSummaries } from '@/lib/dashboard/data';
import { MapView } from '@/components/map/map-view';
import type { MapWarehouse } from '@/components/map/warehouse-map';
import { MapPin } from 'lucide-react';

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const scope = await loadScope(supabase, user.id);

  // Warehouses are RLS-scoped to the caller; merge with stock summaries for
  // pin colour + popup figures.
  const [{ data: warehouses }, summaries] = await Promise.all([
    supabase
      .from('warehouses')
      .select('id, name, code, type, latitude, longitude, district:district_id(name, region:region_id(name))')
      .eq('status', 'operational'),
    scope ? getWarehouseSummaries(supabase, scope) : Promise.resolve([]),
  ]);

  const stockById = new Map(summaries.map((s) => [s.warehouse_id, s]));

  const markers: MapWarehouse[] = (warehouses ?? [])
    .filter((w: any) => w.latitude != null && w.longitude != null)
    .map((w: any) => {
      const s = stockById.get(w.id);
      const capacityPct =
        s && s.capacity_m3
          ? Math.min(100, Math.round((Number(s.used_volume_m3) / Number(s.capacity_m3)) * 100))
          : null;
      return {
        id: w.id,
        name: w.name,
        code: w.code,
        type: w.type,
        region: w.district?.region?.name ?? null,
        lat: Number(w.latitude),
        lng: Number(w.longitude),
        available: s ? Number(s.available_quantity || 0) : 0,
        capacityPct,
      };
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">National Warehouse Map</h1>
        <p className="text-ink-subtle">Geographic view of all NADMO warehouses</p>
      </div>

      {markers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-border bg-card py-16 text-center text-ink-subtle">
          <MapPin className="h-9 w-9 opacity-25" />
          <p>No warehouses with map coordinates to plot.</p>
        </div>
      ) : (
        <MapView warehouses={markers} />
      )}
    </div>
  );
}
