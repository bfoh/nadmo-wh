import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ChartCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-0.5">
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-xs text-ink-subtle">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Curated categorical palette — anchored on NADMO green, chosen to stay legible
// on both the Carbon white and Gray-100 dark surfaces. Not semantic (a colour
// here does not imply status), so distribution slices never read as "critical".
export const CHART_PALETTE = [
  '#0F6B3D',
  '#1D9A6C',
  '#3DA5D9',
  '#E8912F',
  '#7A5C99',
  '#4C9F70',
  '#2C6E8F',
  '#B0603D',
];
