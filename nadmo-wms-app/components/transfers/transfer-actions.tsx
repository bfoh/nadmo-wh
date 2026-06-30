'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { TransferOrder, TransferItem, Profile, UserRole } from '@/types';
import { canApproveTransfer } from '@/lib/auth';

interface TransferActionsProps {
  transfer: TransferOrder;
  items: TransferItem[];
  profile: Profile | null;
}

export function TransferActions({ transfer, items, profile }: TransferActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [vehicleReg, setVehicleReg] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, string>>({});

  const role = profile?.role as UserRole;
  const canApprove = profile && canApproveTransfer(role, transfer.scale);

  async function updateStatus(status: TransferOrder['status'], extra: Record<string, any> = {}) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transfer_orders')
        .update({ status, ...extra })
        .eq('id', transfer.id);

      if (error) throw error;

      toast.success(`Transfer ${status.replace(/_/g, ' ')}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    await updateStatus('approved', {
      approved_by: profile?.id,
      approved_at: new Date().toISOString(),
    });
  }

  async function handleDispatch() {
    if (!vehicleReg || !driverName) {
      toast.error('Vehicle registration and driver name are required');
      return;
    }
    await updateStatus('in_transit', {
      vehicle_registration: vehicleReg,
      driver_name: driverName,
      driver_phone: driverPhone,
      dispatcher_id: profile?.id,
      dispatched_at: new Date().toISOString(),
    });
  }

  async function handleReceive() {
    const updates = items.map((item) => ({
      id: item.id,
      quantity_received: parseInt(receivedQuantities[item.id] || String(item.quantity_dispatched), 10),
    }));

    setLoading(true);
    try {
      for (const update of updates) {
        const { error } = await supabase
          .from('transfer_items')
          .update({ quantity_received: update.quantity_received })
          .eq('id', update.id);

        if (error) throw error;
      }

      const { error } = await supabase
        .from('transfer_orders')
        .update({
          status: 'received',
          received_by: profile?.id,
          received_at: new Date().toISOString(),
          actual_delivery_at: new Date().toISOString(),
        })
        .eq('id', transfer.id);

      if (error) throw error;

      toast.success('Transfer received successfully');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to receive transfer');
    } finally {
      setLoading(false);
    }
  }

  if (transfer.status === 'pending_approval' && canApprove) {
    return (
      <div className="flex gap-3">
        <Button onClick={handleApprove} disabled={loading} className="bg-[#006B3F] hover:bg-[#024F2E]">
          Approve Transfer
        </Button>
      </div>
    );
  }

  if (transfer.status === 'approved') {
    return (
      <Card className="p-4">
        <h3 className="font-medium mb-4">Dispatch Transfer</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Vehicle Registration</Label>
            <Input value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Driver Name</Label>
            <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Driver Phone</Label>
            <Input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleDispatch} disabled={loading} className="bg-[#006B3F] hover:bg-[#024F2E]">
          Mark as In Transit
        </Button>
      </Card>
    );
  }

  if (transfer.status === 'in_transit') {
    return (
      <Card className="p-4">
        <h3 className="font-medium mb-4">Confirm Receipt</h3>
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-2 gap-4 items-center">
              <div className="text-sm">
                {item.sku?.name} <span className="text-muted-foreground">(dispatched {item.quantity_dispatched})</span>
              </div>
              <Input
                type="number"
                min="0"
                placeholder="Received quantity"
                value={receivedQuantities[item.id] || ''}
                onChange={(e) =>
                  setReceivedQuantities({ ...receivedQuantities, [item.id]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
        <Button onClick={handleReceive} disabled={loading} className="bg-[#10B981] hover:bg-[#059669]">
          Confirm Receipt
        </Button>
      </Card>
    );
  }

  return null;
}
