import { KpiCard } from '@/components/dashboard/kpi-card';
import { Warehouse, Truck, Boxes, Gauge } from 'lucide-react';
import type { DashboardKpis } from '@/lib/dashboard/data';

export function KpiStrip({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Warehouses"
        value={kpis.warehouses}
        description="Operational in your scope"
        icon={Warehouse}
      />
      <KpiCard
        title="In Transit"
        value={kpis.inTransit}
        description="Active shipments"
        icon={Truck}
        variant="warning"
      />
      <KpiCard
        title="Available Units"
        value={kpis.availableUnits.toLocaleString()}
        description="Stock ready to dispatch"
        icon={Boxes}
        variant="success"
      />
      <KpiCard
        title="Capacity Used"
        value={`${kpis.capacityPct}%`}
        description="Of total storage volume"
        icon={Gauge}
        variant={kpis.capacityPct >= 90 ? 'critical' : kpis.capacityPct >= 75 ? 'warning' : 'default'}
      />
    </div>
  );
}
