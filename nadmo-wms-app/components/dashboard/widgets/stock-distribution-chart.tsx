'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { ChartCard, CHART_PALETTE } from './chart-card';

type Slice = { name: string; value: number };

function Tip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { pct: number } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="elev-2 border border-border bg-popover px-3 py-2 text-xs">
      <div className="font-medium text-ink">{p.name}</div>
      <div className="nums text-ink-subtle">
        {p.value.toLocaleString()} units · {p.payload.pct}%
      </div>
    </div>
  );
}

export function StockDistributionChart({ regions }: { regions: { name: string; available: number }[] }) {
  const data: Slice[] = regions
    .filter((r) => r.available > 0)
    .sort((a, b) => b.available - a.available)
    .map((r) => ({ name: r.name, value: r.available }));

  const total = data.reduce((s, d) => s + d.value, 0);
  const withPct = data.map((d) => ({ ...d, pct: total ? Math.round((d.value / total) * 100) : 0 }));

  return (
    <ChartCard title="Stock Distribution" description="Available units by region">
      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-ink-subtle">
          <PieChartIcon className="h-9 w-9 opacity-25" />
          <p className="text-sm">No stock to distribute yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-[200px] w-full sm:w-[200px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={withPct}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={1.5}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {withPct.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<Tip />} cursor={false} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center total */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-semibold text-ink nums leading-none">
                {total.toLocaleString()}
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                Total units
              </span>
            </div>
          </div>

          {/* Legend */}
          <ul className="min-w-0 flex-1 space-y-1.5">
            {withPct.slice(0, 6).map((d, i) => (
              <li key={d.name} className="flex items-center gap-2.5 text-sm">
                <span
                  className="size-2.5 shrink-0"
                  style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-ink-muted">{d.name}</span>
                <span className="nums shrink-0 font-medium text-ink">{d.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
