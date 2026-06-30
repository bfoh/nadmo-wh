import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { TransferActions } from '@/components/transfers/transfer-actions';
import { TransferTimeline } from '@/components/transfers/transfer-timeline';

interface TransferDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransferDetailPage({ params }: TransferDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  const { data: transfer } = await supabase
    .from('transfer_orders')
    .select(
      '*, source_warehouse:source_warehouse_id(*), destination_warehouse:destination_warehouse_id(*), creator:created_by(*), approver:approved_by(*), receiver:received_by(*)'
    )
    .eq('id', id)
    .single();

  if (!transfer) {
    notFound();
  }

  const { data: items } = await supabase
    .from('transfer_items')
    .select('*, sku:sku_id(*)')
    .eq('transfer_id', id);

  const { data: approvalSteps } = await supabase
    .from('transfer_approval_steps')
    .select('*, actor:actor_id(*)')
    .eq('transfer_id', id)
    .order('step_number');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/transfers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">{transfer.transfer_number}</h1>
            <p className="text-muted-foreground">
              {transfer.source_warehouse?.name} → {transfer.destination_warehouse?.name}
            </p>
          </div>
        </div>
        <StatusBadge status={transfer.status} />
      </div>

      <TransferActions transfer={transfer} items={items || []} profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium">Item</th>
                      <th className="text-right py-2 text-sm font-medium">Dispatched</th>
                      <th className="text-right py-2 text-sm font-medium">Received</th>
                      <th className="text-left py-2 text-sm font-medium">Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items || []).map((item: any) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3">
                          <div className="font-medium">{item.sku?.name}</div>
                          <div className="text-xs text-muted-foreground">{item.batch_lot}</div>
                        </td>
                        <td className="text-right py-3">{item.quantity_dispatched}</td>
                        <td className="text-right py-3">{item.quantity_received ?? '—'}</td>
                        <td className="py-3">
                          <StatusBadge status={item.condition} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <TransferTimeline transfer={transfer} approvalSteps={approvalSteps || []} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium capitalize">{transfer.priority}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected Delivery</span>
                <span className="font-medium">
                  {transfer.expected_delivery_at
                    ? new Date(transfer.expected_delivery_at).toLocaleDateString('en-GB')
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-medium">
                  {transfer.creator
                    ? `${transfer.creator.first_name} ${transfer.creator.last_name}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approved By</span>
                <span className="font-medium">
                  {transfer.approver
                    ? `${transfer.approver.first_name} ${transfer.approver.last_name}`
                    : 'Pending'}
                </span>
              </div>
              {transfer.vehicle_registration && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium">{transfer.vehicle_registration}</span>
                </div>
              )}
              {transfer.driver_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Driver</span>
                  <span className="font-medium">{transfer.driver_name}</span>
                </div>
              )}
              {transfer.notes && (
                <div className="pt-3 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Notes</div>
                  <div className="text-sm">{transfer.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
