import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { loadScope } from '@/lib/scope';
import { canCreateTransfer, canApproveTransfer } from '@/lib/auth';
import {
  getWarehouseSummaries,
  getRegionSummaries,
  getKpis,
  computeStockKpis,
  getInTransitCount,
  getRecentTransfers,
  getWarehouseRecentTransfers,
  getPendingApprovals,
  getRegionNameMap,
  getScopeHeading,
  buildHierarchy,
} from '@/lib/dashboard/data';
import { KpiStrip } from '@/components/dashboard/widgets/kpi-strip';
import { WarehouseStockTable } from '@/components/dashboard/widgets/warehouse-stock-table';
import { RecentTransfers } from '@/components/dashboard/widgets/recent-transfers';
import { ApprovalsQueue } from '@/components/dashboard/widgets/approvals-queue';
import { HierarchyDrilldown } from '@/components/dashboard/widgets/hierarchy-drilldown';
import { DashboardTabs } from '@/components/dashboard/widgets/dashboard-tabs';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // dashboard layout redirects unauthenticated users

  const scope = await loadScope(supabase, user.id);
  if (!scope) return null;

  const showNewTransfer = canCreateTransfer(scope.role);
  const canApprove = canApproveTransfer(scope.role, 'routine');

  const [warehouseSummaries, regionNames, heading] = await Promise.all([
    getWarehouseSummaries(supabase, scope),
    getRegionNameMap(supabase),
    getScopeHeading(supabase, scope),
  ]);

  // Transfers awaiting *this user's* approval (by scale).
  let myApprovals: any[] = [];
  if (canApprove) {
    const pending = await getPendingApprovals(supabase);
    myApprovals = pending.filter((t: any) => canApproveTransfer(scope.role, t.scale));
  }

  const actionBar = (
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
  );

  // ---- District / warehouse scope ----
  if (scope.level === 'warehouse') {
    const kpis = await getKpis(supabase, scope, warehouseSummaries);
    const recent = await getRecentTransfers(supabase, scope);
    return (
      <div className="space-y-6">
        {actionBar}
        <KpiStrip kpis={kpis} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WarehouseStockTable
              title="Your warehouse"
              warehouses={warehouseSummaries}
              regionNames={regionNames}
            />
          </div>
          <div className="space-y-6">
            {canApprove && <ApprovalsQueue transfers={myApprovals} />}
            <RecentTransfers transfers={recent} />
          </div>
        </div>
      </div>
    );
  }

  // ---- Regional / national scope (both use the hierarchy tree) ----
  const regionSummaries = await getRegionSummaries(supabase, scope);
  const hierarchy = buildHierarchy(regionSummaries, warehouseSummaries);

  if (scope.level === 'regional') {
    const kpis = await getKpis(supabase, scope, warehouseSummaries);
    const recent = await getRecentTransfers(supabase, scope);
    return (
      <div className="space-y-6">
        {actionBar}
        <KpiStrip kpis={kpis} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HierarchyDrilldown
              title="Your region"
              regions={hierarchy.regions}
              national={hierarchy.national}
              defaultOpen
            />
          </div>
          <div className="space-y-6">
            {canApprove && <ApprovalsQueue transfers={myApprovals} />}
            <RecentTransfers transfers={recent} />
          </div>
        </div>
      </div>
    );
  }

  // ---- National scope (DG / auditor / hq_admin) and HQ operational (tabbed) ----
  const nationalKpis = await getKpis(supabase, scope, warehouseSummaries);
  const nationalRecent = await getRecentTransfers(supabase, scope);

  const nationalView = (
    <div className="space-y-6">
      <KpiStrip kpis={nationalKpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HierarchyDrilldown
            title="National Network"
            regions={hierarchy.regions}
            national={hierarchy.national}
          />
        </div>
        <div className="space-y-6">
          {canApprove && <ApprovalsQueue transfers={myApprovals} />}
          <RecentTransfers transfers={nationalRecent} />
        </div>
      </div>
    </div>
  );

  // DG / Auditor / HQ Admin: no operational warehouse -> national view only.
  if (!scope.primaryWarehouseId) {
    return (
      <div className="space-y-6">
        {actionBar}
        {nationalView}
      </div>
    );
  }

  // HQ Logistics/Procurement: operate the HQ warehouse + national oversight -> tabs.
  const hqSummaries = warehouseSummaries.filter(
    (w) => w.warehouse_id === scope.primaryWarehouseId
  );
  const myInTransit = await getInTransitCount(supabase, scope.primaryWarehouseId);
  const myKpis = { ...computeStockKpis(hqSummaries), inTransit: myInTransit };
  const myRecent = await getWarehouseRecentTransfers(supabase, scope.primaryWarehouseId);

  const myWarehouseView = (
    <div className="space-y-6">
      <KpiStrip kpis={myKpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WarehouseStockTable
            title="My warehouse"
            warehouses={hqSummaries}
            regionNames={regionNames}
          />
        </div>
        <div className="space-y-6">
          {canApprove && <ApprovalsQueue transfers={myApprovals} />}
          <RecentTransfers transfers={myRecent} />
        </div>
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
