import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransferList } from '@/components/transfers/transfer-list';
import { Plus } from 'lucide-react';

export default async function TransfersPage() {
  const supabase = await createClient();

  const { data: transfers } = await supabase
    .from('transfer_orders')
    .select(
      '*, source_warehouse:source_warehouse_id(name), destination_warehouse:destination_warehouse_id(name), creator:created_by(first_name, last_name)'
    )
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Transfer Orders</h1>
          <p className="text-muted-foreground">Manage inter-warehouse stock movements</p>
        </div>
        <Link href="/transfers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Transfer
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <TransferList transfers={transfers || []} />
        </CardContent>
      </Card>
    </div>
  );
}
