'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown, PackageX } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Inventory } from '@/types';

interface InventoryTableProps {
  inventory: Inventory[];
  pageSize?: number;
}

type StatusFilter = 'all' | 'in_stock' | 'low' | 'expiring' | 'expired';
type SortKey = 'quantity' | 'available_quantity' | 'expiry_date';

const LOW_THRESHOLD = 500;
const EXPIRY_SOON_DAYS = 90;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'expiring', label: 'Expiring soon' },
  { value: 'expired', label: 'Expired' },
];

function daysUntil(date: string | null | undefined, now: number) {
  if (!date) return null;
  return Math.floor((new Date(date).getTime() - now) / 86_400_000);
}

function fmtDate(date: string | null | undefined) {
  return date ? new Date(date).toLocaleDateString('en-GB') : 'N/A';
}

export function InventoryTable({ inventory, pageSize = 25 }: InventoryTableProps) {
  const [query, setQuery] = useState('');
  const [warehouse, setWarehouse] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'quantity',
    dir: 'desc',
  });
  const [page, setPage] = useState(1);

  const now = Date.now();

  const warehouseOptions = useMemo(() => {
    const map = new Map<string, string>();
    inventory.forEach((i) => {
      const id = i.warehouse_id;
      if (id) map.set(id, i.warehouse?.name || id);
    });
    return [{ value: 'all', label: 'All warehouses' }, ...[...map].map(([value, label]) => ({ value, label }))];
  }, [inventory]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((i) => {
      const name = (i.sku as any)?.category?.name;
      if (name) set.add(name);
    });
    return [{ value: 'all', label: 'All categories' }, ...[...set].sort().map((c) => ({ value: c, label: c }))];
  }, [inventory]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = inventory.filter((i) => {
      if (warehouse !== 'all' && i.warehouse_id !== warehouse) return false;
      if (category !== 'all' && (i.sku as any)?.category?.name !== category) return false;

      const avail = Number(i.available_quantity ?? 0);
      const d = daysUntil(i.expiry_date, now);
      if (status === 'in_stock' && avail <= 0) return false;
      if (status === 'low' && !(avail > 0 && avail < LOW_THRESHOLD)) return false;
      if (status === 'expiring' && !(d != null && d >= 0 && d <= EXPIRY_SOON_DAYS)) return false;
      if (status === 'expired' && !(d != null && d < 0)) return false;

      if (q) {
        const hay = `${i.sku?.name ?? ''} ${i.sku?.sku_code ?? ''} ${i.warehouse?.name ?? ''} ${i.batch_lot ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    rows.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'expiry_date') {
        const av = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
        const bv = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
        return (av - bv) * dir;
      }
      return (Number(a[sort.key] ?? 0) - Number(b[sort.key] ?? 0)) * dir;
    });
    return rows;
  }, [inventory, query, warehouse, category, status, sort, now]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  // Reset to page 1 whenever the filters change.
  useEffect(() => setPage(1), [query, warehouse, category, status]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sort.key !== k) return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />;
    return sort.dir === 'asc' ? (
      <ArrowUp className="ml-1 inline size-3" />
    ) : (
      <ArrowDown className="ml-1 inline size-3" />
    );
  }

  function exportCsv() {
    const headers = ['Warehouse', 'Item', 'Code', 'Category', 'Batch', 'Quantity', 'Reserved', 'Available', 'Expiry', 'Location'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = filtered.map((i) =>
      [
        i.warehouse?.name ?? i.warehouse_id,
        i.sku?.name,
        i.sku?.sku_code,
        (i.sku as any)?.category?.name ?? '',
        i.batch_lot,
        i.quantity,
        i.reserved_quantity,
        i.available_quantity,
        fmtDate(i.expiry_date),
        i.storage_location ?? '',
      ]
        .map(esc)
        .join(',')
    );
    const csv = [headers.map(esc).join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by item, code, warehouse, or batch…"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Select items={warehouseOptions} value={warehouse} onValueChange={(v) => setWarehouse(v || 'all')}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {warehouseOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select items={categoryOptions} value={category} onValueChange={(v) => setCategory(v || 'all')}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categoryOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={STATUS_OPTIONS}
            value={status}
            onValueChange={(v) => setStatus((v as StatusFilter) || 'all')}
          >
            <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv} className="w-full sm:w-auto" disabled={total === 0}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-ink-subtle">
          <PackageX className="h-9 w-9 opacity-25" />
          <p>No inventory matches your filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Batch/Lot</TableHead>
                  <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('quantity')}>
                    Quantity <SortIcon k="quantity" />
                  </TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('available_quantity')}>
                    Available <SortIcon k="available_quantity" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('expiry_date')}>
                    Expiry <SortIcon k="expiry_date" />
                  </TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.warehouse?.name || item.warehouse_id}</TableCell>
                    <TableCell>
                      <div>{item.sku?.name}</div>
                      <div className="text-xs text-ink-subtle">{item.sku?.sku_code}</div>
                    </TableCell>
                    <TableCell>{item.batch_lot}</TableCell>
                    <TableCell className="text-right nums">{item.quantity}</TableCell>
                    <TableCell className="text-right nums">{item.reserved_quantity}</TableCell>
                    <TableCell className="text-right font-semibold nums">{item.available_quantity}</TableCell>
                    <TableCell>{fmtDate(item.expiry_date)}</TableCell>
                    <TableCell>{item.storage_location || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {pageRows.map((item) => (
              <div key={item.id} className="border border-border p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{item.sku?.name}</div>
                    <div className="text-xs text-ink-subtle">
                      {item.sku?.sku_code} · {item.warehouse?.name || item.warehouse_id}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-semibold text-ink nums leading-none">{item.available_quantity}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-faint">Available</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-subtle">
                  {item.batch_lot && <span>Batch: <span className="font-medium text-ink">{item.batch_lot}</span></span>}
                  <span>Qty: <span className="font-medium text-ink nums">{item.quantity}</span></span>
                  <span>Expiry: <span className="font-medium text-ink">{fmtDate(item.expiry_date)}</span></span>
                  {item.storage_location && <span>Loc: <span className="font-medium text-ink">{item.storage_location}</span></span>}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row">
            <span className="text-xs text-ink-subtle nums">
              Showing {start + 1}–{Math.min(start + pageSize, total)} of {total}
            </span>
            {pageCount > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                  Prev
                </Button>
                <span className="text-xs text-ink-subtle nums">
                  Page {current} / {pageCount}
                </span>
                <Button variant="outline" size="sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
