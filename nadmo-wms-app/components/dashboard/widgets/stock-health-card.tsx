import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockAlertRow } from '@/lib/dashboard/data';

const STATUS: Record<string, { label: string; pill: string; dot: string }> = {
  critical: {
    label: 'Critical',
    pill: 'bg-critical-soft text-critical-foreground border-critical-border',
    dot: 'bg-critical',
  },
  amber: {
    label: 'Low',
    pill: 'bg-strained-soft text-strained-foreground border-strained-border',
    dot: 'bg-strained',
  },
};

export function StockHealthCard({
  alerts,
  showWarehouse = true,
}: {
  alerts: StockAlertRow[];
  showWarehouse?: boolean;
}) {
  const criticalCount = alerts.filter((a) => a.status === 'critical').length;
  const tone = criticalCount > 0 ? 'critical' : alerts.length > 0 ? 'strained' : undefined;

  return (
    <Card tone={tone}>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>Stock Health</CardTitle>
        {alerts.length > 0 && (
          <span className="text-xs font-medium text-ink-subtle nums">
            {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
            {criticalCount > 0 && (
              <span className="text-critical-foreground"> · {criticalCount} critical</span>
            )}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                  {showWarehouse && <th className="py-2 pr-4 font-semibold">Warehouse</th>}
                  <th className="py-2 pr-4 font-semibold">Category</th>
                  <th className="py-2 pr-4 text-right font-semibold">Available</th>
                  <th className="py-2 pr-4 text-right font-semibold">Min</th>
                  <th className="py-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, i) => {
                  const s = STATUS[a.status] ?? STATUS.amber;
                  return (
                    <tr
                      key={`${a.warehouse_id}-${a.category_name}-${i}`}
                      className="border-b border-border/70 last:border-0 transition-colors hover:bg-muted/50"
                    >
                      {showWarehouse && (
                        <td className="py-2.5 pr-4 font-medium text-ink">{a.warehouse_name}</td>
                      )}
                      <td className="py-2.5 pr-4 text-ink-muted">{a.category_name}</td>
                      <td className="py-2.5 pr-4 text-right font-semibold text-ink nums">
                        {Number(a.available).toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-ink-subtle nums">
                        {Number(a.min_quantity).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
                            s.pill
                          )}
                        >
                          <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {alerts.map((a, i) => {
              const s = STATUS[a.status] ?? STATUS.amber;
              return (
                <div
                  key={`${a.warehouse_id}-${a.category_name}-${i}`}
                  className="border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {showWarehouse && (
                        <div className="truncate text-sm font-medium text-ink">{a.warehouse_name}</div>
                      )}
                      <div className="truncate text-xs text-ink-subtle">{a.category_name}</div>
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
                        s.pill
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
                      {s.label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-ink-subtle">
                    <span>
                      Available{' '}
                      <span className="nums font-semibold text-ink">
                        {Number(a.available).toLocaleString()}
                      </span>
                    </span>
                    <span>
                      Min <span className="nums font-medium text-ink-muted">{Number(a.min_quantity).toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-ready-soft">
              <ShieldCheck className="size-6 text-ready" />
            </div>
            <div>
              <p className="font-medium text-ink">All stock levels healthy</p>
              <p className="text-xs text-ink-subtle">No categories below threshold in your scope.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
