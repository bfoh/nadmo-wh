import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse as WarehouseIcon } from 'lucide-react';
import type { WarehouseSummary } from '@/lib/dashboard/data';

const TYPE_LABEL: Record<string, string> = {
  hq: 'HQ',
  regional: 'Regional',
  district: 'District',
};

function capacityPct(w: WarehouseSummary): number | null {
  if (!w.capacity_m3 || w.capacity_m3 <= 0) return null;
  return Math.min(100, Math.round((Number(w.used_volume_m3) / Number(w.capacity_m3)) * 100));
}

export function WarehouseStockTable({
  title = 'Warehouses',
  warehouses,
  regionNames,
  limit,
}: {
  title?: string;
  warehouses: WarehouseSummary[];
  regionNames: Map<string, string>;
  limit?: number;
}) {
  const rows = [...warehouses]
    .sort((a, b) => Number(b.available_quantity) - Number(a.available_quantity))
    .slice(0, limit ?? warehouses.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Warehouse</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium text-right">Available</th>
                  <th className="py-2 font-medium">Capacity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => {
                  const pct = capacityPct(w);
                  const barColor =
                    pct === null
                      ? 'bg-slate-300'
                      : pct >= 90
                        ? 'bg-[#CE1126]'
                        : pct >= 75
                          ? 'bg-amber-500'
                          : 'bg-[#006B3F]';
                  return (
                    <tr key={w.warehouse_id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-[#0F172A]">{w.warehouse_name}</div>
                        {w.region_id && (
                          <div className="text-xs text-muted-foreground">
                            {regionNames.get(w.region_id) ?? ''}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {TYPE_LABEL[w.warehouse_type] ?? w.warehouse_type}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-semibold text-[#006B3F]">
                        {Number(w.available_quantity).toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div className={`h-full ${barColor}`} style={{ width: `${pct ?? 0}%` }} />
                          </div>
                          <span className="w-9 text-right text-xs text-muted-foreground">
                            {pct === null ? '—' : `${pct}%`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
            <WarehouseIcon className="mb-3 h-10 w-10 opacity-20" />
            <p>No warehouse stock to show yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
