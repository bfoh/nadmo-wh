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
import { canApproveAtLevel, nextRung, ROLE_LABELS } from '@/lib/auth';
import {
  approveTransfer,
  rejectTransfer,
  escalateTransfer,
  resubmitTransfer,
  cancelTransfer,
} from '@/app/(dashboard)/transfers/[id]/actions';

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
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<null | 'reject' | 'escalate'>(null);

  const role = profile?.role as UserRole;
  const requiredLevel = transfer.required_level ?? 99;
  const canApprove = !!profile && canApproveAtLevel(role, requiredLevel);
  const isCreator = profile?.id === transfer.created_by;
  const nextLevel = nextRung(requiredLevel);
  const ROLE_BY_LEVEL: Record<number, UserRole> = {
    2: 'district_officer', 3: 'regional_manager', 5: 'hq_logistics', 8: 'dg',
  };

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

  async function runAction(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    setLoading(true);
    try {
      const res = await fn();
      if (!res.ok) throw new Error(res.error);
      toast.success(ok);
      setMode(null);
      setReason('');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    await runAction(() => approveTransfer(transfer.id), 'Transfer approved');
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

  if (transfer.status === 'pending_approval') {
    const slaLabel = transfer.sla_due_at
      ? new Date(transfer.sla_due_at).toLocaleString('en-GB')
      : '—';
    return (
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">Awaiting</span>
          <span className="font-medium">{ROLE_LABELS[ROLE_BY_LEVEL[requiredLevel] ?? 'dg']}</span>
          <span className="text-muted-foreground">· SLA due {slaLabel}</span>
          {transfer.escalation_count > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              Escalated ×{transfer.escalation_count}
            </span>
          )}
        </div>

        {canApprove && mode === null && (
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleApprove} disabled={loading} className="bg-[#006B3F] hover:bg-[#024F2E]">
              Approve Transfer
            </Button>
            <Button onClick={() => setMode('reject')} disabled={loading} variant="outline">
              Reject
            </Button>
            {nextLevel !== requiredLevel && (
              <Button onClick={() => setMode('escalate')} disabled={loading} variant="outline">
                Escalate to {ROLE_LABELS[ROLE_BY_LEVEL[nextLevel] ?? 'dg']}
              </Button>
            )}
          </div>
        )}

        {canApprove && mode !== null && (
          <div className="space-y-3">
            <Label>{mode === 'reject' ? 'Rejection reason' : 'Escalation reason'}</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required" />
            <div className="flex gap-3">
              <Button
                disabled={loading || !reason.trim()}
                className="bg-[#006B3F] hover:bg-[#024F2E]"
                onClick={() =>
                  mode === 'reject'
                    ? runAction(() => rejectTransfer(transfer.id, reason), 'Transfer rejected')
                    : runAction(() => escalateTransfer(transfer.id, reason), 'Transfer escalated')
                }
              >
                Confirm {mode === 'reject' ? 'Rejection' : 'Escalation'}
              </Button>
              <Button variant="ghost" disabled={loading} onClick={() => { setMode(null); setReason(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!canApprove && (
          <p className="text-sm text-muted-foreground">You do not have authority to action this transfer at its current tier.</p>
        )}
      </Card>
    );
  }

  if (transfer.status === 'rejected') {
    return (
      <Card className="p-4 space-y-3">
        <div>
          <h3 className="font-medium">Transfer rejected</h3>
          {transfer.rejection_reason && (
            <p className="text-sm text-muted-foreground">Reason: {transfer.rejection_reason}</p>
          )}
        </div>
        {isCreator && (
          <div className="flex gap-3">
            <Button
              disabled={loading}
              className="bg-[#006B3F] hover:bg-[#024F2E]"
              onClick={() => runAction(() => resubmitTransfer(transfer.id), 'Resubmitted for approval')}
            >
              Resubmit
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => runAction(() => cancelTransfer(transfer.id, 'Cancelled by creator'), 'Transfer cancelled')}
            >
              Cancel Transfer
            </Button>
          </div>
        )}
      </Card>
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
