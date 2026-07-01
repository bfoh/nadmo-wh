import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { canManageUsers } from '@/lib/auth';
import {
  DeliveryHealthCard,
  type DeliveryHealth,
} from '@/components/notifications/delivery-health-card';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  if (!profile || !canManageUsers(profile.role)) {
    redirect('/');
  }

  // Notification delivery health (last 7 days) — admins can read all deliveries.
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: rows }, { data: failureRows }] = await Promise.all([
    supabase.from('notification_deliveries').select('channel, status').gte('created_at', since),
    supabase
      .from('notification_deliveries')
      .select('id, channel, recipient, error, created_at, notification:notification_id(title)')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const all = rows ?? [];
  const count = (ch: string | null, st: string) =>
    all.filter((r: any) => (ch ? r.channel === ch : true) && r.status === st).length;
  const sent = count(null, 'sent');
  const failed = count(null, 'failed');
  const pending = count(null, 'pending') + count(null, 'processing');
  const resolved = sent + failed;
  const health: DeliveryHealth = {
    sent,
    failed,
    pending,
    total: all.length,
    ratePct: resolved > 0 ? Math.round((sent / resolved) * 100) : 100,
    byChannel: {
      email: { sent: count('email', 'sent'), failed: count('email', 'failed') },
      sms: { sent: count('sms', 'sent'), failed: count('sms', 'failed') },
    },
    failures: (failureRows ?? []).map((f: any) => ({
      id: f.id,
      channel: f.channel,
      recipient: f.recipient,
      error: f.error,
      created_at: f.created_at,
      title: f.notification?.title ?? null,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">System Settings</h1>
        <p className="text-muted-foreground">Configure platform settings and thresholds</p>
      </div>

      <DeliveryHealthCard health={health} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            System configuration will be available in a future release. For now, thresholds and approval rules can be configured directly in the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
