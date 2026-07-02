'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import type { MapWarehouse } from './warehouse-map';

const WarehouseMap = dynamic(() => import('./warehouse-map').then((m) => m.WarehouseMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-ink-subtle">
      Loading map…
    </div>
  ),
});

type Filter = 'all' | 'hq' | 'regional' | 'district' | 'stock' | 'low' | 'empty';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hq', label: 'HQ' },
  { key: 'regional', label: 'Regional' },
  { key: 'district', label: 'District' },
  { key: 'stock', label: 'With stock' },
  { key: 'low', label: 'Low' },
  { key: 'empty', label: 'Empty' },
];

function matches(w: MapWarehouse, f: Filter) {
  switch (f) {
    case 'all':
      return true;
    case 'hq':
    case 'regional':
    case 'district':
      return w.type === f;
    case 'stock':
      return w.available > 0;
    case 'low':
      return w.available > 0 && w.available < 500;
    case 'empty':
      return w.available <= 0;
  }
}

export function MapView({ warehouses }: { warehouses: MapWarehouse[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const stats = useMemo(() => {
    const total = warehouses.length;
    const zero = warehouses.filter((w) => w.available <= 0).length;
    const low = warehouses.filter((w) => w.available > 0 && w.available < 500).length;
    const healthy = total - zero - low;
    return { total, healthy, low, zero };
  }, [warehouses]);

  const visible = useMemo(() => warehouses.filter((w) => matches(w, filter)), [warehouses, filter]);

  return (
    <div className="flex flex-col gap-3">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, dot: 'bg-ink-faint' },
          { label: 'Healthy', value: stats.healthy, dot: 'bg-ready' },
          { label: 'Low stock', value: stats.low, dot: 'bg-strained' },
          { label: 'Zero stock', value: stats.zero, dot: 'bg-critical' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 border border-border bg-card px-3 py-2">
            <span className={cn('size-2 rounded-full', s.dot)} aria-hidden />
            <span className="nums text-lg font-semibold text-ink">{s.value}</span>
            <span className="text-xs text-ink-subtle">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={cn(
              'border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-ink-subtle hover:bg-muted hover:text-ink'
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-ink-subtle nums">
          {visible.length} shown
        </span>
      </div>

      {/* Map */}
      <div className="h-[calc(100dvh-13rem)] min-h-[560px] w-full overflow-hidden border border-border">
        <WarehouseMap warehouses={visible} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-subtle">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-ready" /> Healthy</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-strained" /> Low</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-critical" /> Zero</span>
        <span className="ml-2 text-ink-faint">★ HQ · R Regional · D District</span>
      </div>
    </div>
  );
}
