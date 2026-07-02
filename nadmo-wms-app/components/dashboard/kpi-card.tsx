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

// Colour lives in the icon chip + accents only — no card edge. Keeps the tiles
// clean and premium while status stays legible.
const ICON_CHIP: Record<Variant, string> = {
  default: 'bg-muted text-ink-muted',
  info: 'bg-info-soft text-info',
  success: 'bg-ready-soft text-ready',
  warning: 'bg-strained-soft text-strained',
  critical: 'bg-critical-soft text-critical',
};

const DESC_COLOR: Record<Variant, string> = {
  default: 'text-ink-subtle',
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
  return (
    <Card className="group/kpi gap-0 px-5 sm:px-6 transition-shadow duration-150 hover:elev-2">
      <div className="flex items-start justify-between gap-3">
        <span className="pt-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-muted">
          {title}
        </span>
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center transition-transform duration-150 group-hover/kpi:scale-105',
            ICON_CHIP[variant]
          )}
        >
          <Icon className="size-[18px]" />
        </div>
      </div>

      <div className="mt-2.5 sm:mt-3.5 font-display text-[1.9rem] sm:text-[2.5rem] font-semibold leading-none tracking-[-0.025em] text-ink nums">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </div>

      {progress ? (
        (() => {
          const t = barTone(progress.pct);
          return (
            <div className="mt-4 border-t border-border/70 pt-3">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium">
                <span className="truncate text-ink-subtle">{progress.label}</span>
                <span className={cn('nums shrink-0 pl-2', t.text)}>{progress.pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden bg-muted">
                <div
                  className={cn('h-full transition-[width] duration-500 ease-out', t.fill)}
                  style={{ width: `${Math.min(100, Math.max(0, progress.pct))}%` }}
                />
              </div>
            </div>
          );
        })()
      ) : (
        description && (
          <p className={cn('mt-2 text-xs sm:text-[13px] font-normal', DESC_COLOR[variant])}>
            {description}
          </p>
        )
      )}
    </Card>
  );
}
