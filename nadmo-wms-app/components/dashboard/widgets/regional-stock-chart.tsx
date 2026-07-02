'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ChartCard, CHART_PALETTE } from './chart-card';

function Tip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="elev-2 border border-border bg-popover px-3 py-2 text-xs">
      <div className="font-medium text-ink">{label}</div>
      <div className="nums text-ink-subtle">{payload[0].value.toLocaleString()} available units</div>
    </div>
  );
}

export function RegionalStockChart({ regions }: { regions: { name: string; available: number }[] }) {
  const data = regions
    .filter((r) => r.available > 0)
    .sort((a, b) => b.available - a.available)
    .slice(0, 8)
    .map((r) => ({ name: r.name.replace(/ Region$/, ''), value: r.available }));

  const height = Math.max(200, data.length * 40 + 24);

  return (
    <ChartCard title="Stock by Region" description="Available units, top regions">
      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-ink-subtle">
          <BarChart3 className="h-9 w-9 opacity-25" />
          <p className="text-sm">No regional stock to compare yet.</p>
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={104}
                tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<Tip />} cursor={{ fill: 'var(--muted)' }} />
              <Bar dataKey="value" radius={0} isAnimationActive={false}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
