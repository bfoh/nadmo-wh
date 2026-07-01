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
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                  <th className="py-2 pr-4 font-semibold">Warehouse</th>
                  <th className="py-2 pr-4 font-semibold">Type</th>
                  <th className="py-2 pr-4 text-right font-semibold">Available</th>
                  <th className="py-2 font-semibold">Capacity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => {
                  const pct = capacityPct(w);
                  const barColor =
                    pct === null
                      ? 'bg-neutral/40'
                      : pct >= 90
                        ? 'bg-critical'
                        : pct >= 75
                          ? 'bg-strained'
                          : 'bg-ready';
                  return (
                    <tr
                      key={w.warehouse_id}
                      className="border-b border-border/70 last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-ink">{w.warehouse_name}</div>
                        {w.region_id && (
                          <div className="text-xs text-ink-subtle">
                            {regionNames.get(w.region_id) ?? ''}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-ink-subtle">
                        {TYPE_LABEL[w.warehouse_type] ?? w.warehouse_type}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-semibold text-ink nums">
                        {Number(w.available_quantity).toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct ?? 0}%` }} />
                          </div>
                          <span className="w-9 text-right text-xs text-ink-subtle nums">
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
          <div className="flex flex-col items-center gap-2 py-10 text-center text-ink-subtle">
            <WarehouseIcon className="mb-1 h-9 w-9 opacity-25" />
            <p>No warehouse stock to show yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
