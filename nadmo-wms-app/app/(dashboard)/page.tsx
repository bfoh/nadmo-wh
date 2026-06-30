import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { loadScope } from '@/lib/scope';
import { canCreateTransfer } from '@/lib/auth';
import {
  getWarehouseSummaries,
  getRegionSummaries,
  getKpis,
  getRecentTransfers,
  getRegionNameMap,
  getScopeHeading,
} from '@/lib/dashboard/data';
import { KpiStrip } from '@/components/dashboard/widgets/kpi-strip';
import { RegionStockTable } from '@/components/dashboard/widgets/region-stock-table';
import { WarehouseStockTable } from '@/components/dashboard/widgets/warehouse-stock-table';
import { RecentTransfers } from '@/components/dashboard/widgets/recent-transfers';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the dashboard layout redirects unauthenticated users

  const scope = await loadScope(supabase, user.id);
  if (!scope) return null;

  const [warehouseSummaries, regionSummaries, recentTransfers, regionNames, heading] =
    await Promise.all([
      getWarehouseSummaries(supabase, scope),
      scope.level === 'warehouse'
        ? Promise.resolve([])
        : getRegionSummaries(supabase, scope),
      getRecentTransfers(supabase, scope),
      getRegionNameMap(supabase),
      getScopeHeading(supabase, scope),
    ]);

  const kpis = await getKpis(supabase, scope, warehouseSummaries);
  const showNewTransfer = canCreateTransfer(scope.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{heading.title}</h1>
          <p className="text-muted-foreground">{heading.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/transfers">
            <Button variant="outline">
              View Transfers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          {showNewTransfer && (
            <Link href="/transfers/new">
              <Button className="bg-[#006B3F] hover:bg-[#024F2E]">
                <Plus className="mr-2 h-4 w-4" />
                New Transfer
              </Button>
            </Link>
          )}
        </div>
      </div>

      <KpiStrip kpis={kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {scope.level === 'national' ? (
            <RegionStockTable regions={regionSummaries} />
          ) : scope.level === 'regional' ? (
            <WarehouseStockTable
              title="Warehouses in your region"
              warehouses={warehouseSummaries}
              regionNames={regionNames}
            />
          ) : (
            <WarehouseStockTable
              title="Your warehouse"
              warehouses={warehouseSummaries}
              regionNames={regionNames}
            />
          )}
        </div>
        <RecentTransfers transfers={recentTransfers} />
      </div>

      {scope.level === 'national' && (
        <WarehouseStockTable
          title="Top warehouses by available stock"
          warehouses={warehouseSummaries}
          regionNames={regionNames}
          limit={10}
        />
      )}
    </div>
  );
}
