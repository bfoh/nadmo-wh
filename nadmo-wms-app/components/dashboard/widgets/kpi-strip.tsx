import { KpiCard } from '@/components/dashboard/kpi-card';
import { Warehouse, Truck, Boxes, AlertTriangle } from 'lucide-react';
import type { DashboardKpis } from '@/lib/dashboard/data';

export function KpiStrip({ kpis }: { kpis: DashboardKpis }) {
  const lowStockVariant =
    kpis.critical > 0 ? 'critical' : kpis.lowStock > 0 ? 'warning' : 'success';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        title="Warehouses"
        value={kpis.warehouses}
        description="Operational in your scope"
        icon={Warehouse}
      />
      <KpiCard
        title="In Transit"
        value={kpis.inTransit}
        description={kpis.inTransit === 1 ? 'Active shipment' : 'Active shipments'}
        icon={Truck}
        variant="info"
      />
      <KpiCard
        title="Available Units"
        value={kpis.availableUnits.toLocaleString()}
        icon={Boxes}
        variant="success"
        progress={{ pct: kpis.capacityPct, label: 'Network capacity used' }}
      />
      <KpiCard
        title="Low Stock"
        value={kpis.lowStock}
        description={
          kpis.critical > 0
            ? `${kpis.critical} critical · ${kpis.lowStock - kpis.critical} low`
            : kpis.lowStock > 0
              ? 'Categories below threshold'
              : 'All categories healthy'
        }
        icon={AlertTriangle}
        variant={lowStockVariant}
      />
    </div>
  );
}
