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
    <div className="overflow-x-auto">
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
  );
}
