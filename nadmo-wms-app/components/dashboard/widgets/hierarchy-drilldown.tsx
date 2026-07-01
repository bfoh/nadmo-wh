'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Building2, Network } from 'lucide-react';
import type { HierRegion, HierWarehouse } from '@/lib/dashboard/data';

const TYPE_LABEL: Record<string, string> = {
  hq: 'HQ',
  regional: 'Regional',
  district: 'District',
};

function WarehouseRow({ w }: { w: HierWarehouse }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/50">
      <div className="flex min-w-0 items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0 text-ink-faint" />
        <span className="truncate text-sm text-ink">{w.name}</span>
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-subtle">
          {TYPE_LABEL[w.type] ?? w.type}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs">
        <span className="font-semibold text-ink nums">{w.available.toLocaleString()}</span>
        {w.capacityPct !== null && (
          <span className="w-9 text-right text-ink-subtle nums">{w.capacityPct}%</span>
        )}
      </div>
    </div>
  );
}

export function HierarchyDrilldown({
  regions,
  national,
  title = 'Network Overview',
  defaultOpen = false,
}: {
  regions: HierRegion[];
  national: HierWarehouse[];
  title?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(
    defaultOpen ? Object.fromEntries(regions.map((r) => [r.id, true])) : {}
  );
  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const hasContent = regions.length > 0 || national.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasContent ? (
          <div className="space-y-1.5">
            {national.length > 0 && (
              <div className="mb-2 rounded-lg border border-border bg-muted/40 p-1">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  National (HQ)
                </div>
                {national.map((w) => (
                  <WarehouseRow key={w.id} w={w} />
                ))}
              </div>
            )}

            {regions.map((region) => {
              const isOpen = !!open[region.id];
              return (
                <div key={region.id} className="overflow-hidden rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => toggle(region.id)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`h-4 w-4 text-ink-faint transition-transform duration-150 ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                      />
                      <span className="font-medium text-ink">{region.name}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-ink-subtle nums">
                        {region.warehouses.length} WH
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-ink nums">
                      {region.available.toLocaleString()}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border bg-muted/30 p-1">
                      {region.warehouses.map((w) => (
                        <WarehouseRow key={w.id} w={w} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
            <Network className="mb-3 h-10 w-10 opacity-20" />
            <p>No warehouses in your scope yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
