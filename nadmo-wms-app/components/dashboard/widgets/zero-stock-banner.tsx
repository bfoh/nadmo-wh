import { AlertTriangle } from 'lucide-react';

/**
 * Surfaces regions reporting zero available inventory at the top of the
 * dashboard — the "all healthy" message alone hid this. Real data only:
 * renders nothing when every region has stock.
 */
export function ZeroStockBanner({
  regions,
}: {
  regions: { name: string; available: number }[];
}) {
  const empty = regions.filter((r) => r.available <= 0).map((r) => r.name);
  if (empty.length === 0) return null;

  const names = empty.length <= 4 ? empty.join(', ') : `${empty.slice(0, 4).join(', ')} +${empty.length - 4} more`;

  return (
    <div
      role="alert"
      className="relative flex flex-col gap-2 border border-critical-border bg-critical-soft px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-critical" aria-hidden />
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-critical" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-critical-foreground">
            {empty.length} {empty.length === 1 ? 'region reports' : 'regions report'} zero inventory
          </p>
          <p className="mt-0.5 text-ink-muted">{names} · immediate restocking required.</p>
        </div>
      </div>
      <a
        href="#national-network"
        className="shrink-0 self-start pl-8 text-sm font-medium text-critical-foreground underline-offset-4 hover:underline sm:self-center sm:pl-0"
      >
        View details →
      </a>
    </div>
  );
}
