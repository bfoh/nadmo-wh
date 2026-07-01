import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import type { RegionSummary } from '@/lib/dashboard/data';

export function RegionStockTable({ regions }: { regions: RegionSummary[] }) {
  const withStock = regions.filter((r) => r.warehouse_count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock by Region</CardTitle>
      </CardHeader>
      <CardContent>
        {withStock.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                  <th className="py-2 pr-4 font-semibold">Region</th>
                  <th className="py-2 pr-4 text-right font-semibold">Warehouses</th>
                  <th className="py-2 pr-4 text-right font-semibold">Available</th>
                  <th className="py-2 text-right font-semibold">Total Units</th>
                </tr>
              </thead>
              <tbody>
                {withStock.map((r) => (
                  <tr
                    key={r.region_id}
                    className="border-b border-border/70 last:border-0 transition-colors hover:bg-muted/50"
                  >
                    <td className="py-2.5 pr-4 font-medium text-ink">{r.region_name}</td>
                    <td className="py-2.5 pr-4 text-right text-ink-subtle nums">
                      {r.warehouse_count}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-ink nums">
                      {Number(r.available_quantity).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-ink-subtle nums">
                      {Number(r.total_quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-ink-subtle">
            <Globe className="mb-1 h-9 w-9 opacity-25" />
            <p>No regional stock to show yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
