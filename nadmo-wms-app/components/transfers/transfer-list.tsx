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
                <Link href={`/transfers/${transfer.id}`} className="text-[#006B3F] hover:underline">
                  {transfer.transfer_number}
                </Link>
              </TableCell>
              <TableCell>{transfer.source_warehouse?.name}</TableCell>
              <TableCell>{transfer.destination_warehouse?.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={transfer.status} />
                  {transfer.escalation_count > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      ↑{transfer.escalation_count}
                    </span>
                  )}
                  {transfer.status === 'pending_approval' &&
                    transfer.sla_due_at &&
                    new Date(transfer.sla_due_at) < new Date() && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        Overdue
                      </span>
                    )}
                  {transfer.discrepancy_status === 'open' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      Discrepancy
                    </span>
                  )}
                </div>
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
