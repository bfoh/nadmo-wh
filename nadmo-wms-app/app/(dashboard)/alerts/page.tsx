import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

export default async function AlertsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: alerts } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Alerts & Notifications</h1>
        <p className="text-muted-foreground">Stay informed about stock levels, transfers, and emergencies</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.type === 'critical_stock' || alert.type === 'overdue_shipment'
                      ? 'border-l-4 border-l-[#C41E3A] bg-red-50'
                      : alert.type === 'amber_stock'
                      ? 'border-l-4 border-l-[#F59E0B] bg-amber-50'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{alert.message}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.created_at).toLocaleString('en-GB')}
                      </div>
                    </div>
                    <StatusBadge status={alert.type} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No notifications found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
