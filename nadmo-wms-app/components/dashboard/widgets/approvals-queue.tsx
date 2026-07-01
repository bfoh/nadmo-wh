import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { ROLE_LABELS, approverRoleForLevel } from '@/lib/auth';

const PRIORITY_STYLES: Record<string, string> = {
  emergency: 'bg-critical-soft text-critical-foreground border border-critical-border',
  urgent: 'bg-strained-soft text-strained-foreground border border-strained-border',
  routine: 'bg-neutral-soft text-ink-subtle border border-border',
};

export function ApprovalsQueue({ transfers }: { transfers: any[] }) {
  const tone = transfers.length > 0 ? 'strained' : undefined;
  return (
    <Card tone={tone}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Awaiting Your Approval</CardTitle>
        {transfers.length > 0 && (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-strained px-2 text-xs font-semibold text-white nums">
            {transfers.length}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {transfers.length > 0 ? (
          <div className="space-y-3">
            {transfers.map((t) => {
              const tier = t.required_level ? ROLE_LABELS[approverRoleForLevel(t.required_level)] : null;
              const due = t.sla_due_at ? new Date(t.sla_due_at) : null;
              const overdue = due ? due.getTime() < Date.now() : false;
              return (
                <Link
                  key={t.id}
                  href={`/transfers/${t.id}`}
                  className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 hover:border-border/0 hover:elev-1"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[13px] font-medium text-ink">{t.transfer_number}</div>
                      <div className="truncate text-sm text-ink-subtle">
                        {t.source_warehouse?.name} → {t.destination_warehouse?.name}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.routine
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-subtle">
                    {tier && (
                      <span className="inline-flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {tier}
                      </span>
                    )}
                    {due && (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          overdue ? 'font-medium text-critical-foreground' : ''
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {overdue
                          ? `Overdue ${formatDistanceToNow(due)}`
                          : `Due in ${formatDistanceToNow(due)}`}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-ready-soft">
              <CheckCircle2 className="size-6 text-ready" />
            </div>
            <p className="text-ink-subtle">Nothing awaiting your approval.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
