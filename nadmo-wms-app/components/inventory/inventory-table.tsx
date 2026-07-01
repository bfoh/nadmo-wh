'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Inventory } from '@/types';

interface InventoryTableProps {
  inventory: Inventory[];
}

export function InventoryTable({ inventory }: InventoryTableProps) {
  if (inventory.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No inventory records found.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Batch/Lot</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.warehouse?.name || item.warehouse_id}</TableCell>
                <TableCell>
                  <div>{item.sku?.name}</div>
                  <div className="text-xs text-muted-foreground">{item.sku?.sku_code}</div>
                </TableCell>
                <TableCell>{item.batch_lot}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{item.reserved_quantity}</TableCell>
                <TableCell className="text-right font-semibold">{item.available_quantity}</TableCell>
                <TableCell>
                  {item.expiry_date
                    ? new Date(item.expiry_date).toLocaleDateString('en-GB')
                    : 'N/A'}
                </TableCell>
                <TableCell>{item.storage_location || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-3">
        {inventory.map((item) => (
          <div
            key={item.id}
            className="rounded-none border border-border p-3.5 space-y-2"
          >
            {/* Card header: warehouse + SKU */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-ink text-sm truncate">
                  {item.sku?.name}
                </div>
                <div className="text-xs text-ink-subtle">
                  {item.sku?.sku_code} · {item.warehouse?.name || item.warehouse_id}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-semibold text-ink nums leading-none">
                  {item.available_quantity}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-ink-faint mt-0.5">
                  Available
                </div>
              </div>
            </div>

            {/* Card detail row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-subtle">
              {item.batch_lot && (
                <span>Batch: <span className="text-ink font-medium">{item.batch_lot}</span></span>
              )}
              <span>Qty: <span className="text-ink font-medium nums">{item.quantity}</span></span>
              {item.reserved_quantity > 0 && (
                <span>Reserved: <span className="text-ink font-medium nums">{item.reserved_quantity}</span></span>
              )}
              <span>
                Expiry:{' '}
                <span className="text-ink font-medium">
                  {item.expiry_date
                    ? new Date(item.expiry_date).toLocaleDateString('en-GB')
                    : 'N/A'}
                </span>
              </span>
              {item.storage_location && (
                <span>Loc: <span className="text-ink font-medium">{item.storage_location}</span></span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
