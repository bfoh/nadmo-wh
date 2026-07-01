import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface DeliveryHealth {
  sent: number;
  failed: number;
  pending: number;
  total: number;
  ratePct: number;
  byChannel: {
    email: { sent: number; failed: number };
    sms: { sent: number; failed: number };
  };
  failures: {
    id: string;
    channel: string;
    recipient: string;
    error: string | null;
    created_at: string;
    title: string | null;
  }[];
}

function Tile({ label, value, tint }: { label: string; value: string | number; tint: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tint}`}>{value}</div>
    </div>
  );
}

export function DeliveryHealthCard({ health }: { health: DeliveryHealth }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notification Delivery (last 7 days)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile label="Sent" value={health.sent} tint="text-primary" />
          <Tile label="Failed" value={health.failed} tint="text-critical" />
          <Tile label="Pending" value={health.pending} tint="text-strained" />
          <Tile label="Delivery rate" value={`${health.ratePct}%`} tint="text-ink" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span className="flex items-center gap-2 font-medium text-ink">
              <Mail className="h-4 w-4 text-primary" /> Email
            </span>
            <span className="text-muted-foreground">
              {health.byChannel.email.sent} sent · {health.byChannel.email.failed} failed
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span className="flex items-center gap-2 font-medium text-ink">
              <MessageSquare className="h-4 w-4 text-primary" /> SMS
            </span>
            <span className="text-muted-foreground">
              {health.byChannel.sms.sent} sent · {health.byChannel.sms.failed} failed
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-ink">Recent failures</div>
          {health.failures.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Channel</th>
                    <th className="px-3 py-2 font-medium">Recipient</th>
                    <th className="px-3 py-2 font-medium">Error</th>
                    <th className="px-3 py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {health.failures.map((f) => (
                    <tr key={f.id} className="border-b last:border-0">
                      <td className="px-3 py-2 capitalize text-muted-foreground">{f.channel}</td>
                      <td className="px-3 py-2 text-ink">{f.recipient}</td>
                      <td className="max-w-[260px] truncate px-3 py-2 text-critical" title={f.error ?? ''}>
                        {f.error ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-lg border py-8 text-center text-muted-foreground">
              <CheckCircle2 className="mb-2 h-8 w-8 text-primary opacity-40" />
              <p className="text-sm">No delivery failures.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
