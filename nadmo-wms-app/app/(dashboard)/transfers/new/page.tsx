import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TransferForm } from '@/components/transfers/transfer-form';

export default async function NewTransferPage() {
  const supabase = await createClient();

  const { data: warehouses } = await supabase.from('warehouses').select('*').eq('status', 'operational');
  const { data: skus } = await supabase.from('skus').select('*, category:category_id(*)').eq('is_active', true);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/transfers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Create Transfer Order</h1>
          <p className="text-muted-foreground">Move stock between NADMO warehouses</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transfer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TransferForm warehouses={warehouses || []} skus={skus || []} />
        </CardContent>
      </Card>
    </div>
  );
}
