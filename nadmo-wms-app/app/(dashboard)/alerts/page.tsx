import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  { accent: string; iconBox: string; chip: string; cardBg: string }
> = {
  critical: {
    accent: 'border-l-[#CE1126]',
    iconBox: 'bg-red-100 text-[#CE1126]',
    chip: 'bg-red-50 text-[#CE1126] ring-1 ring-inset ring-red-200',
    cardBg: 'bg-red-50/40',
  },
  warning: {
    accent: 'border-l-[#F59E0B]',
    iconBox: 'bg-amber-100 text-amber-700',
    chip: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    cardBg: 'bg-amber-50/40',
  },
  info: {
    accent: 'border-l-[#006B3F]',
    iconBox: 'bg-green-100 text-[#006B3F]',
    chip: 'bg-green-50 text-[#006B3F] ring-1 ring-inset ring-green-200',
    cardBg: 'bg-white',
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
    { label: 'Total', value: counts.total, tint: 'text-[#0F172A]' },
    { label: 'Critical', value: counts.critical, tint: 'text-[#CE1126]' },
    { label: 'Warnings', value: counts.warning, tint: 'text-amber-600' },
    { label: 'Unread', value: counts.unread, tint: 'text-[#006B3F]' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Alerts &amp; Notifications</h1>
        <p className="text-muted-foreground">
          Stay informed about stock levels, transfers, and emergencies
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
              <div className={`mt-1 text-3xl font-bold ${s.tint}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Notifications</CardTitle>
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
                    className={`flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/40 ${
                      alert.is_read ? 'bg-white' : styles.cardBg
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.iconBox}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0F172A]">{alert.title}</span>
                        {!alert.is_read && (
                          <span className="inline-flex items-center rounded-full bg-[#006B3F] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <time dateTime={created.toISOString()} title={created.toLocaleString('en-GB')}>
                          {formatDistanceToNow(created, { addSuffix: true })}
                        </time>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${styles.chip}`}
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
              <p className="font-medium text-[#0F172A]">You&apos;re all caught up</p>
              <p className="text-sm text-muted-foreground">No notifications to show right now.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
