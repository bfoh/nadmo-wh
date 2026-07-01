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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { canApproveAtLevel, nextRung, ROLE_LABELS, canReceiveTransfer, canResolveDiscrepancy } from '@/lib/auth';
import {
  approveTransfer,
  rejectTransfer,
  escalateTransfer,
  resubmitTransfer,
  cancelTransfer,
  receiveTransfer,
  resolveDiscrepancy,
  type ReceiveLine,
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
  const [conditions, setConditions] = useState<Record<string, string>>({});
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [resolveNote, setResolveNote] = useState('');

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

  function lineFor(item: TransferItem): ReceiveLine {
    const qtyStr = receivedQuantities[item.id];
    const quantity_received =
      qtyStr === undefined || qtyStr === '' ? item.quantity_dispatched : parseInt(qtyStr, 10);
    const condition = (conditions[item.id] || 'good') as ReceiveLine['condition'];
    return { item_id: item.id, quantity_received, condition };
  }

  const receiptHasMismatch = items.some((item) => {
    const l = lineFor(item);
    return l.quantity_received !== item.quantity_dispatched || l.condition !== 'good';
  });

  async function handleReceive() {
    const lines = items.map(lineFor);
    if (lines.some((l) => l.quantity_received > items.find((i) => i.id === l.item_id)!.quantity_dispatched)) {
      toast.error('Received quantity cannot exceed dispatched');
      return;
    }
    if (receiptHasMismatch && !discrepancyReason.trim()) {
      toast.error('A discrepancy reason is required');
      return;
    }
    await runAction(
      () => receiveTransfer(transfer.id, lines, discrepancyReason),
      receiptHasMismatch ? 'Received with discrepancy' : 'Transfer received'
    );
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
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-strained-soft text-strained-foreground border border-strained-border">
              Escalated ×{transfer.escalation_count}
            </span>
          )}
        </div>

        {canApprove && mode === null && (
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleApprove} disabled={loading}>
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
        <Button onClick={handleDispatch} disabled={loading}>
          Mark as In Transit
        </Button>
      </Card>
    );
  }

  if (transfer.status === 'in_transit') {
    if (!canReceiveTransfer(role)) {
      return (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Awaiting receipt by destination warehouse staff.</p>
        </Card>
      );
    }
    return (
      <Card className="p-4">
        <h3 className="font-medium mb-4">Confirm Receipt</h3>
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="text-sm">
                {item.sku?.name}{' '}
                <span className="text-muted-foreground">(dispatched {item.quantity_dispatched})</span>
              </div>
              <Input
                type="number"
                min="0"
                max={item.quantity_dispatched}
                placeholder="Received quantity"
                value={receivedQuantities[item.id] ?? ''}
                onChange={(e) =>
                  setReceivedQuantities({ ...receivedQuantities, [item.id]: e.target.value })
                }
              />
              <Select
                value={conditions[item.id] || 'good'}
                onValueChange={(value) => setConditions({ ...conditions, [item.id]: value || 'good' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        {receiptHasMismatch && (
          <div className="space-y-2 mb-4">
            <Label>Discrepancy reason (required)</Label>
            <Input
              value={discrepancyReason}
              onChange={(e) => setDiscrepancyReason(e.target.value)}
              placeholder="Explain the shortfall or damage"
            />
          </div>
        )}
        <Button onClick={handleReceive} disabled={loading} className="bg-ready hover:bg-ready/90">
          Confirm Receipt
        </Button>
      </Card>
    );
  }

  if (transfer.discrepancy_status === 'open') {
    return (
      <Card className="p-4 space-y-3">
        <div>
          <h3 className="font-medium">Discrepancy reported</h3>
          {transfer.discrepancy_reason && (
            <p className="text-sm text-muted-foreground">Reason: {transfer.discrepancy_reason}</p>
          )}
        </div>
        {canResolveDiscrepancy(role) ? (
          <div className="space-y-2">
            <Label>Resolution note (required)</Label>
            <Input
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="How was this resolved?"
            />
            <Button
              disabled={loading || !resolveNote.trim()}
             
              onClick={() => runAction(() => resolveDiscrepancy(transfer.id, resolveNote), 'Discrepancy resolved')}
            >
              Resolve Discrepancy
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Pending resolution by HQ or the source warehouse.</p>
        )}
      </Card>
    );
  }

  return null;
}
