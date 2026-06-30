import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import type { StockAlertRow } from '@/lib/dashboard/data';

const STATUS_STYLES: Record<string, string> = {
  critical: 'bg-red-50 text-[#CE1126] ring-1 ring-inset ring-red-200',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
};

export function StockHealthCard({
  alerts,
  showWarehouse = true,
}: {
  alerts: StockAlertRow[];
  showWarehouse?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stock Health</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {showWarehouse && <th className="py-2 pr-4 font-medium">Warehouse</th>}
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium text-right">Available</th>
                  <th className="py-2 pr-4 font-medium text-right">Min</th>
                  <th className="py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, i) => (
                  <tr key={`${a.warehouse_id}-${a.category_name}-${i}`} className="border-b last:border-0 hover:bg-muted/40">
                    {showWarehouse && (
                      <td className="py-2.5 pr-4 font-medium text-[#0F172A]">{a.warehouse_name}</td>
                    )}
                    <td className="py-2.5 pr-4 text-muted-foreground">{a.category_name}</td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-[#0F172A]">
                      {Number(a.available).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">
                      {Number(a.min_quantity).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          STATUS_STYLES[a.status]
                        }`}
                      >
                        {a.status === 'amber' ? 'Low' : 'Critical'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
            <ShieldCheck className="mb-3 h-10 w-10 text-[#006B3F] opacity-30" />
            <p>All stock levels are healthy.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
