import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { LucideIcon } from 'lucide-react';

type Variant = 'default' | 'info' | 'critical' | 'warning' | 'success';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: Variant;
  /** Optional utilization/progress bar rendered below the value (real data only). */
  progress?: { pct: number; label: string };
}

// Variant → readiness tone. "default" stays neutral (no rail); the rest carry
// the readiness rail + a tinted icon so status reads at a glance.
const TONE: Record<Variant, 'ready' | 'strained' | 'critical' | 'info' | undefined> = {
  default: undefined,
  info: 'info',
  success: 'ready',
  warning: 'strained',
  critical: 'critical',
};

const ICON_CHIP: Record<Variant, string> = {
  default: 'bg-muted text-ink-muted',
  info: 'bg-info-soft text-info',
  success: 'bg-ready-soft text-ready',
  warning: 'bg-strained-soft text-strained',
  critical: 'bg-critical-soft text-critical',
};

const DESC_COLOR: Record<Variant, string> = {
  default: 'text-ink-muted',
  info: 'text-info-foreground',
  success: 'text-ready-foreground',
  warning: 'text-strained-foreground',
  critical: 'text-critical-foreground',
};

// Utilization bar colour is semantic: healthy → strained → critical.
function barTone(pct: number) {
  if (pct >= 90) return { fill: 'bg-critical', text: 'text-critical-foreground' };
  if (pct >= 75) return { fill: 'bg-strained', text: 'text-strained-foreground' };
  return { fill: 'bg-ready', text: 'text-ready-foreground' };
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
  progress,
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
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </div>

      {progress ? (
        (() => {
          const t = barTone(progress.pct);
          return (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium">
                <span className="text-ink-subtle">{progress.label}</span>
                <span className={cn('nums', t.text)}>{progress.pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden bg-muted">
                <div
                  className={cn('h-full', t.fill)}
                  style={{ width: `${Math.min(100, Math.max(0, progress.pct))}%` }}
                />
              </div>
            </div>
          );
        })()
      ) : (
        description && (
          <p className={cn('mt-2 text-[13px] font-normal', DESC_COLOR[variant])}>{description}</p>
        )
      )}
    </Card>
  );
}
