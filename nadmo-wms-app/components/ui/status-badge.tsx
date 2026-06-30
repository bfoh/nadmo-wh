import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  ready_for_dispatch: 'bg-blue-50 text-blue-700 border-blue-200',
  in_transit: 'bg-blue-50 text-blue-700 border-blue-200',
  received: 'bg-green-50 text-green-700 border-green-200',
  discrepancy: 'bg-red-50 text-red-700 border-red-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  operational: 'bg-green-50 text-green-700 border-green-200',
  limited: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
  critical_stock: 'bg-red-50 text-red-700 border-red-200',
  amber_stock: 'bg-amber-50 text-amber-700 border-amber-200',
  good: 'bg-green-50 text-green-700 border-green-200',
  damaged: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  missing: 'bg-slate-100 text-slate-500 border-slate-200',
};

const statusLabels: Record<string, string> = {
  pending_approval: 'Pending Approval',
  ready_for_dispatch: 'Ready for Dispatch',
  in_transit: 'In Transit',
  critical_stock: 'Critical',
  amber_stock: 'Warning',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200',
        className
      )}
    >
      {statusLabels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
    </span>
  );
}
