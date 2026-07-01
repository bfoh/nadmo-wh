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
    <>
      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto">
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
                  <Link href={`/transfers/${transfer.id}`} className="text-primary hover:underline">
                    {transfer.transfer_number}
                  </Link>
                </TableCell>
                <TableCell>{transfer.source_warehouse?.name}</TableCell>
                <TableCell>{transfer.destination_warehouse?.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={transfer.status} />
                    {transfer.escalation_count > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-strained-soft text-strained-foreground border border-strained-border">
                        ↑{transfer.escalation_count}
                      </span>
                    )}
                    {transfer.status === 'pending_approval' &&
                      transfer.sla_due_at &&
                      new Date(transfer.sla_due_at) < new Date() && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-critical-soft text-critical-foreground border border-critical-border">
                          Overdue
                        </span>
                      )}
                    {transfer.discrepancy_status === 'open' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-critical-soft text-critical-foreground border border-critical-border">
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

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-3">
        {transfers.map((transfer) => (
          <Link
            key={transfer.id}
            href={`/transfers/${transfer.id}`}
            className="block rounded-none border border-border p-3.5 transition-colors active:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-[13px] font-medium text-primary">
                  {transfer.transfer_number}
                </div>
                <div className="mt-0.5 text-sm text-ink truncate">
                  {transfer.source_warehouse?.name}
                  <span className="text-ink-faint mx-1">→</span>
                  {transfer.destination_warehouse?.name}
                </div>
              </div>
              <StatusBadge status={transfer.status} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {transfer.escalation_count > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-strained-soft text-strained-foreground border border-strained-border">
                  ↑{transfer.escalation_count}
                </span>
              )}
              {transfer.status === 'pending_approval' &&
                transfer.sla_due_at &&
                new Date(transfer.sla_due_at) < new Date() && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-critical-soft text-critical-foreground border border-critical-border">
                    Overdue
                  </span>
                )}
              {transfer.discrepancy_status === 'open' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-critical-soft text-critical-foreground border border-critical-border">
                  Discrepancy
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-ink-subtle">
              <span>{new Date(transfer.created_at).toLocaleDateString('en-GB')}</span>
              {transfer.creator && (
                <span>
                  by {transfer.creator.first_name} {transfer.creator.last_name}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
