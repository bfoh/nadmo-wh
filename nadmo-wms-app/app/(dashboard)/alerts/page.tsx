import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkAllReadButton } from '@/components/alerts/mark-all-read-button';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  PackageX,
  Clock,
  ClipboardCheck,
  ShieldAlert,
  CalendarClock,
  Truck,
  PackageCheck,
  Bell,
  BellOff,
} from 'lucide-react';

type Severity = 'critical' | 'warning' | 'info';

type TypeMeta = {
  severity: Severity;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TYPE_META: Record<string, TypeMeta> = {
  critical_stock: { severity: 'critical', label: 'Critical Stock', icon: PackageX },
  overdue_shipment: { severity: 'critical', label: 'Overdue Shipment', icon: Clock },
  discrepancy: { severity: 'critical', label: 'Discrepancy', icon: AlertTriangle },
  approval_escalation: { severity: 'critical', label: 'Escalation', icon: ShieldAlert },
  amber_stock: { severity: 'warning', label: 'Low Stock', icon: AlertTriangle },
  expiry_warning: { severity: 'warning', label: 'Expiry Warning', icon: CalendarClock },
  approval_required: { severity: 'warning', label: 'Approval Required', icon: ClipboardCheck },
  transfer_dispatched: { severity: 'info', label: 'Dispatched', icon: Truck },
  transfer_received: { severity: 'info', label: 'Received', icon: PackageCheck },
  system: { severity: 'info', label: 'System', icon: Bell },
};

const FALLBACK_META: TypeMeta = { severity: 'info', label: 'Notification', icon: Bell };

const SEVERITY_STYLES: Record<
  Severity,
  { accent: string; iconBox: string; chip: string; unreadBg: string }
> = {
  critical: {
    accent: 'bg-critical',
    iconBox: 'bg-critical-soft text-critical',
    chip: 'bg-critical-soft text-critical-foreground border border-critical-border',
    unreadBg: 'bg-critical-soft/40',
  },
  warning: {
    accent: 'bg-strained',
    iconBox: 'bg-strained-soft text-strained',
    chip: 'bg-strained-soft text-strained-foreground border border-strained-border',
    unreadBg: 'bg-strained-soft/40',
  },
  info: {
    accent: 'bg-info',
    iconBox: 'bg-info-soft text-info',
    chip: 'bg-info-soft text-info-foreground border border-info-border',
    unreadBg: 'bg-info-soft/30',
  },
};

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: alerts } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const list = alerts ?? [];
  const counts = {
    total: list.length,
    critical: list.filter((a) => (TYPE_META[a.type] ?? FALLBACK_META).severity === 'critical').length,
    warning: list.filter((a) => (TYPE_META[a.type] ?? FALLBACK_META).severity === 'warning').length,
    unread: list.filter((a) => !a.is_read).length,
  };

  const summary: { label: string; value: number; tint: string }[] = [
    { label: 'Total', value: counts.total, tint: 'text-ink' },
    { label: 'Critical', value: counts.critical, tint: 'text-critical' },
    { label: 'Warnings', value: counts.warning, tint: 'text-strained' },
    { label: 'Unread', value: counts.unread, tint: 'text-primary' },
  ];

  const summaryTone: Record<string, 'critical' | 'strained' | 'ready' | undefined> = {
    Critical: counts.critical > 0 ? 'critical' : undefined,
    Warnings: counts.warning > 0 ? 'strained' : undefined,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Alerts &amp; Notifications</h1>
          <p className="text-ink-subtle">
            Stay informed about stock levels, transfers, and emergencies
          </p>
        </div>
        <MarkAllReadButton unread={counts.unread} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((s) => (
          <Card key={s.label} size="sm" tone={summaryTone[s.label]} className="px-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              {s.label}
            </div>
            <div className={`mt-2 font-display text-3xl font-semibold tracking-[-0.02em] nums ${s.tint}`}>
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length > 0 ? (
            <div className="space-y-3">
              {list.map((alert) => {
                const meta = TYPE_META[alert.type] ?? FALLBACK_META;
                const styles = SEVERITY_STYLES[meta.severity];
                const Icon = meta.icon;
                const created = new Date(alert.created_at);

                return (
                  <div
                    key={alert.id}
                    className={`relative flex items-start gap-4 overflow-hidden rounded-lg border border-border p-4 transition-colors hover:bg-muted/40 ${
                      alert.is_read ? 'bg-card' : styles.unreadBg
                    }`}
                  >
                    {!alert.is_read && (
                      <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden />
                    )}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.iconBox}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{alert.title}</span>
                        {!alert.is_read && (
                          <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-ink-subtle">{alert.message}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
                        <Clock className="h-3.5 w-3.5" />
                        <time dateTime={created.toISOString()} title={created.toLocaleString('en-GB')}>
                          {formatDistanceToNow(created, { addSuffix: true })}
                        </time>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.chip}`}
                    >
                      {SEVERITY_LABEL[meta.severity]}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <BellOff className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-ink">You&apos;re all caught up</p>
              <p className="text-sm text-muted-foreground">No notifications to show right now.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
