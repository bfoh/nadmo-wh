import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import type { RegionSummary } from '@/lib/dashboard/data';

export function RegionStockTable({ regions }: { regions: RegionSummary[] }) {
  const withStock = regions.filter((r) => r.warehouse_count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stock by Region</CardTitle>
      </CardHeader>
      <CardContent>
        {withStock.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Region</th>
                  <th className="py-2 pr-4 font-medium text-right">Warehouses</th>
                  <th className="py-2 pr-4 font-medium text-right">Available</th>
                  <th className="py-2 font-medium text-right">Total Units</th>
                </tr>
              </thead>
              <tbody>
                {withStock.map((r) => (
                  <tr key={r.region_id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2.5 pr-4 font-medium text-[#0F172A]">{r.region_name}</td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">
                      {r.warehouse_count}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-[#006B3F]">
                      {Number(r.available_quantity).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {Number(r.total_quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
            <Globe className="mb-3 h-10 w-10 opacity-20" />
            <p>No regional stock to show yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
