import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export default async function MapPage() {
  const supabase = await createClient();

  const { data: warehouses } = await supabase
    .from('warehouses')
    .select('*, district:district_id(name, region:region_id(name))')
    .eq('status', 'operational');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">National Warehouse Map</h1>
        <p className="text-muted-foreground">Geographic view of all NADMO warehouses</p>
      </div>

      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle className="text-lg">Warehouse Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-auto">
            {warehouses?.map((warehouse: any) => (
              <div key={warehouse.id} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{warehouse.name}</div>
                    <div className="text-sm text-muted-foreground">{warehouse.code}</div>
                    <div className="text-xs text-muted-foreground mt-1 capitalize">
                      {warehouse.type} • {warehouse.district?.region?.name}
                    </div>
                    {warehouse.latitude && warehouse.longitude && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {warehouse.latitude.toFixed(4)}, {warehouse.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
