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
// the readiness rail + a tinted icon so status is legible at a glance.
const TONE: Record<Variant, 'ready' | 'strained' | 'critical' | undefined> = {
  default: undefined,
  success: 'ready',
  warning: 'strained',
  critical: 'critical',
};

const ICON_CHIP: Record<Variant, string> = {
  default: 'bg-muted text-ink-muted',
  success: 'bg-ready-soft text-ready',
  warning: 'bg-strained-soft text-strained',
  critical: 'bg-critical-soft text-critical',
};

const DESC_COLOR: Record<Variant, string> = {
  default: 'text-ink-muted',
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
    // px-6 supplies the horizontal padding Card omits (Card is py-only), clearing
    // the readiness rail so text is never clipped.
    <Card
      tone={tone}
      className="gap-0 px-6 transition-shadow duration-150 hover:elev-2"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="pt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {title}
        </span>
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center',
            ICON_CHIP[variant]
          )}
        >
          <Icon className="size-[18px]" />
        </div>
      </div>
      <div className="mt-3 font-display text-[2.5rem] font-semibold leading-none tracking-[-0.02em] text-ink nums">
        {value}
      </div>
      {description && (
        <p className={cn('mt-2 text-[13px] font-normal', DESC_COLOR[variant])}>
          {description}
        </p>
      )}
    </Card>
  );
}
