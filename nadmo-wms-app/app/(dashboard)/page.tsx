import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { loadScope, type Scope } from '@/lib/scope';
import { canCreateTransfer, isApproverRole, canApproveAtLevel } from '@/lib/auth';
import {
  getWarehouseSummaries,
  getRegionSummaries,
  getStockHealth,
  getKpiData,
  getRecentTransfers,
  getWarehouseRecentTransfers,
  getPendingApprovals,
  getRegionNameMap,
  getScopeHeading,
  buildHierarchy,
  type ScopeFilter,
} from '@/lib/dashboard/data';
import { KpiStrip } from '@/components/dashboard/widgets/kpi-strip';
import { WarehouseStockTable } from '@/components/dashboard/widgets/warehouse-stock-table';
import { RecentTransfers } from '@/components/dashboard/widgets/recent-transfers';
import { ApprovalsQueue } from '@/components/dashboard/widgets/approvals-queue';
import { HierarchyDrilldown } from '@/components/dashboard/widgets/hierarchy-drilldown';
import { StockHealthCard } from '@/components/dashboard/widgets/stock-health-card';
import { DashboardTabs } from '@/components/dashboard/widgets/dashboard-tabs';

function scopeFilter(scope: Scope): ScopeFilter {
  if (scope.level === 'warehouse') return { warehouseIds: scope.warehouseIds };
  if (scope.level === 'regional') return { regionIds: scope.regionIds };
  return {};
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const scope = await loadScope(supabase, user.id);
  if (!scope) return null;

  const showNewTransfer = canCreateTransfer(scope.role);
  const canApprove = isApproverRole(scope.role);

  const [warehouseSummaries, regionNames, heading, health] = await Promise.all([
    getWarehouseSummaries(supabase, scope),
    getRegionNameMap(supabase),
    getScopeHeading(supabase, scope),
    getStockHealth(supabase, scopeFilter(scope)),
  ]);

  let myApprovals: any[] = [];
  if (canApprove) {
    const pending = await getPendingApprovals(supabase);
    // Awaiting *this user's* tier: the transfer's current required_level must
    // be one the user's role can clear (escalation can raise it beyond scale).
    myApprovals = pending.filter((t: any) => canApproveAtLevel(scope.role, t.required_level ?? 99));
  }

  const actionBar = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-ink">{heading.title}</h1>
        <p className="text-ink-subtle">{heading.subtitle}</p>
      </div>
      <div className="flex gap-2">
        <Link href="/transfers">
          <Button variant="outline">
            View Transfers
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
        {showNewTransfer && (
          <Link href="/transfers/new">
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              New Transfer
            </Button>
          </Link>
        )}
      </div>
    </div>
  );

  const sideColumn = (transfers: any[]) => (
    <div className="space-y-6">
      {canApprove && <ApprovalsQueue transfers={myApprovals} />}
      <RecentTransfers transfers={transfers} />
    </div>
  );

  // ---- District / warehouse scope ----
  if (scope.level === 'warehouse') {
    const kpis = await getKpiData(supabase, warehouseSummaries, health);
    const recent = await getRecentTransfers(supabase, scope);
    return (
      <div className="space-y-6">
        {actionBar}
        <KpiStrip kpis={kpis} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <WarehouseStockTable
              title="Your warehouse"
              warehouses={warehouseSummaries}
              regionNames={regionNames}
            />
            <StockHealthCard alerts={health.alerts} showWarehouse={false} />
          </div>
          {sideColumn(recent)}
        </div>
      </div>
    );
  }

  // ---- Regional / national scope ----
  const regionSummaries = await getRegionSummaries(supabase, scope);
  const hierarchy = buildHierarchy(regionSummaries, warehouseSummaries);

  if (scope.level === 'regional') {
    const kpis = await getKpiData(supabase, warehouseSummaries, health);
    const recent = await getRecentTransfers(supabase, scope);
    return (
      <div className="space-y-6">
        {actionBar}
        <KpiStrip kpis={kpis} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <HierarchyDrilldown
              title="Your region"
              regions={hierarchy.regions}
              national={hierarchy.national}
              defaultOpen
            />
            <StockHealthCard alerts={health.alerts} />
          </div>
          {sideColumn(recent)}
        </div>
      </div>
    );
  }

  // ---- National scope (DG / Auditor / HQ Admin) and HQ operational (tabbed) ----
  const nationalKpis = await getKpiData(supabase, warehouseSummaries, health);
  const nationalRecent = await getRecentTransfers(supabase, scope);

  const nationalView = (
    <div className="space-y-6">
      <KpiStrip kpis={nationalKpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <HierarchyDrilldown
            title="National Network"
            regions={hierarchy.regions}
            national={hierarchy.national}
          />
          <StockHealthCard alerts={health.alerts} />
        </div>
        {sideColumn(nationalRecent)}
      </div>
    </div>
  );

  if (!scope.primaryWarehouseId) {
    return (
      <div className="space-y-6">
        {actionBar}
        {nationalView}
      </div>
    );
  }

  // HQ Logistics/Procurement: operate the HQ warehouse + national oversight.
  const hqId = scope.primaryWarehouseId;
  const hqSummaries = warehouseSummaries.filter((w) => w.warehouse_id === hqId);
  const hqHealth = await getStockHealth(supabase, { warehouseIds: [hqId] });
  const myKpis = await getKpiData(supabase, hqSummaries, hqHealth, hqId);
  const myRecent = await getWarehouseRecentTransfers(supabase, hqId);

  const myWarehouseView = (
    <div className="space-y-6">
      <KpiStrip kpis={myKpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <WarehouseStockTable
            title="My warehouse"
            warehouses={hqSummaries}
            regionNames={regionNames}
          />
          <StockHealthCard alerts={hqHealth.alerts} showWarehouse={false} />
        </div>
        {sideColumn(myRecent)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {actionBar}
      <DashboardTabs myWarehouse={myWarehouseView} national={nationalView} />
    </div>
  );
}
