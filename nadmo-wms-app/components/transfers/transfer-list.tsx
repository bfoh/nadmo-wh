'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { TransferOrder } from '@/types';

interface TransferListProps {
  transfers: TransferOrder[];
}

export function TransferList({ transfers }: TransferListProps) {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No transfer orders found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transfer #</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Created By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((transfer) => (
            <TableRow key={transfer.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/transfers/${transfer.id}`} className="text-[#0066CC] hover:underline">
                  {transfer.transfer_number}
                </Link>
              </TableCell>
              <TableCell>{transfer.source_warehouse?.name}</TableCell>
              <TableCell>{transfer.destination_warehouse?.name}</TableCell>
              <TableCell>
                <StatusBadge status={transfer.status} />
              </TableCell>
              <TableCell>{new Date(transfer.created_at).toLocaleDateString('en-GB')}</TableCell>
              <TableCell>
                {transfer.creator
                  ? `${transfer.creator.first_name} ${transfer.creator.last_name}`
                  : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
