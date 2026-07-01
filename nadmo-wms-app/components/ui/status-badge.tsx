import { cn } from '@/lib/utils';

type Tone = 'ready' | 'strained' | 'critical' | 'info' | 'neutral';

// Every workflow + stock status resolves to one readiness tone, so the whole
// system speaks a single language: ready / strained / critical / info / neutral.
const STATUS_TONE: Record<string, Tone> = {
  // stock health
  good: 'ready',
  amber_stock: 'strained',
  critical_stock: 'critical',
  // warehouse
  operational: 'ready',
  limited: 'strained',
  closed: 'neutral',
  // transfers
  draft: 'neutral',
  pending_approval: 'strained',
  approved: 'info',
  ready_for_dispatch: 'info',
  in_transit: 'info',
  received: 'ready',
  discrepancy: 'critical',
  rejected: 'critical',
  cancelled: 'neutral',
  overdue: 'critical',
  // condition
  damaged: 'critical',
  expired: 'critical',
  missing: 'neutral',
};

const TONE_STYLES: Record<Tone, { pill: string; dot: string }> = {
  ready: { pill: 'bg-ready-soft text-ready-foreground border-ready-border', dot: 'bg-ready' },
  strained: {
    pill: 'bg-strained-soft text-strained-foreground border-strained-border',
    dot: 'bg-strained',
  },
  critical: {
    pill: 'bg-critical-soft text-critical-foreground border-critical-border',
    dot: 'bg-critical',
  },
  info: { pill: 'bg-info-soft text-info-foreground border-info-border', dot: 'bg-info' },
  neutral: { pill: 'bg-neutral-soft text-ink-subtle border-border', dot: 'bg-neutral' },
};

const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pending Approval',
  ready_for_dispatch: 'Ready for Dispatch',
  in_transit: 'In Transit',
  critical_stock: 'Critical',
  amber_stock: 'Low',
  good: 'Healthy',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = STATUS_TONE[status] ?? 'neutral';
  const styles = TONE_STYLES[tone];
  const label =
    STATUS_LABELS[status] ??
    status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        styles.pill,
        className
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', styles.dot)} aria-hidden />
      {label}
    </span>
  );
}
