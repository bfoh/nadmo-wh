import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type Variant = 'default' | 'critical' | 'warning' | 'success';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  variant?: Variant;
}

// Variant → readiness tone. "default" stays neutral (no rail); the others carry
// the readiness rail + a tinted icon so status is legible before reading.
const TONE: Record<Variant, 'ready' | 'strained' | 'critical' | undefined> = {
  default: undefined,
  success: 'ready',
  warning: 'strained',
  critical: 'critical',
};

const ICON_CHIP: Record<Variant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-ready-soft text-ready',
  warning: 'bg-strained-soft text-strained',
  critical: 'bg-critical-soft text-critical',
};

const DESC_COLOR: Record<Variant, string> = {
  default: 'text-ink-subtle',
  success: 'text-ready-foreground',
  warning: 'text-strained-foreground',
  critical: 'text-critical-foreground',
};

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
}: KpiCardProps) {
  const tone = TONE[variant];

  return (
    <Card size="sm" tone={tone} className="gap-0 transition-shadow hover:elev-2">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-faint">
          {title}
        </span>
        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', ICON_CHIP[variant])}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold leading-none tracking-[-0.02em] text-ink nums">
        {value}
      </div>
      {description && (
        <p className={cn('mt-2 text-xs font-medium', DESC_COLOR[variant])}>{description}</p>
      )}
    </Card>
  );
}
