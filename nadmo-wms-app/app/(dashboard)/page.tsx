import { createClient } from '@/lib/supabase/server';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Warehouse,
  Truck,
  AlertTriangle,
  Package,
  TrendingUp,
  ArrowRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { canViewNationalDashboard } from '@/lib/auth';
import { UserRole } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  const role = profile?.role as UserRole;
  const isNationalView = canViewNationalDashboard(role);

  // Fetch KPIs
  const { count: warehouseCount } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'operational');

  const { count: inTransitCount } = await supabase
    .from('transfer_orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['in_transit', 'ready_for_dispatch']);

  const { count: criticalAlertsCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'critical_stock')
    .eq('is_read', false);

  const { count: totalSkuCount } = await supabase
    .from('skus')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Fetch recent transfer activity
  const { data: recentTransfers } = await supabase
    .from('transfer_orders')
    .select('*, source_warehouse:source_warehouse_id(name), destination_warehouse:destination_warehouse_id(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch critical alerts
  const { data: criticalAlerts } = await supabase
    .from('notifications')
    .select('*')
    .eq('type', 'critical_stock')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {isNationalView ? 'National Operations Overview' : 'Warehouse Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isNationalView
              ? 'Real-time visibility across all NADMO warehouses'
              : 'Manage your assigned warehouse operations'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/transfers">
            <Button variant="outline">
              View Transfers
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/transfers/new">
            <Button className="bg-[#0066CC] hover:bg-[#0052a3]">
              <Plus className="w-4 h-4 mr-2" />
              New Transfer
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Warehouses"
          value={warehouseCount ?? 0}
          description="Operational nationwide"
          icon={Warehouse}
        />
        <KpiCard
          title="In Transit"
          value={inTransitCount ?? 0}
          description="Active shipments"
          icon={Truck}
          variant="warning"
        />
        <KpiCard
          title="Critical Alerts"
          value={criticalAlertsCount ?? 0}
          description="Require immediate action"
          icon={AlertTriangle}
          variant={criticalAlertsCount && criticalAlertsCount > 0 ? 'critical' : 'default'}
        />
        <KpiCard
          title="Active SKUs"
          value={totalSkuCount ?? 0}
          description="Items in catalogue"
          icon={Package}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransfers && recentTransfers.length > 0 ? (
              <div className="space-y-4">
                {recentTransfers.map((transfer: any) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{transfer.transfer_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {transfer.source_warehouse?.name} → {transfer.destination_warehouse?.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={transfer.status} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(transfer.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No recent transfer activity</p>
                <Link href="/transfers/new">
                  <Button variant="link" className="mt-2">Create your first transfer</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {criticalAlerts && criticalAlerts.length > 0 ? (
              <div className="space-y-3">
                {criticalAlerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border-l-4 border-l-[#C41E3A] bg-red-50"
                  >
                    <div className="font-medium text-sm">{alert.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{alert.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No critical alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
