import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { StockIntakeForm } from '@/components/inventory/stock-intake-form';
import { StockDispatchForm } from '@/components/inventory/stock-dispatch-form';

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: _profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  // Fetch inventory with SKU details
  const { data: inventory } = await supabase
    .from('inventory')
    .select('*, sku:sku_id(*), warehouse:warehouse_id(*)')
    .order('quantity', { ascending: false })
    .limit(100);

  // Fetch warehouses and SKUs for forms
  const { data: warehouses } = await supabase.from('warehouses').select('*').eq('status', 'operational');
  const { data: skus } = await supabase.from('skus').select('*, category:category_id(*)').eq('is_active', true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Inventory Management</h1>
        <p className="text-muted-foreground">Track stock levels, receive goods, and dispatch relief items</p>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Stock on Hand</TabsTrigger>
          <TabsTrigger value="intake">Receive Stock</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryTable inventory={inventory || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intake">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receive Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <StockIntakeForm warehouses={warehouses || []} skus={skus || []} inventory={inventory || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatch">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dispatch Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <StockDispatchForm warehouses={warehouses || []} skus={skus || []} inventory={inventory || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
