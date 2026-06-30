'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { Sku, Warehouse } from '@/types';
import { X, Plus } from 'lucide-react';

interface TransferLineItem {
  sku_id: string;
  quantity: string;
  batch_lot: string;
}

interface TransferFormProps {
  warehouses: Warehouse[];
  skus: Sku[];
}

export function TransferForm({ warehouses, skus }: TransferFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [priority, setPriority] = useState('routine');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferLineItem[]>([
    { sku_id: '', quantity: '', batch_lot: '' },
  ]);
  // Available batches at the source warehouse, grouped by SKU id.
  const [batchesBySku, setBatchesBySku] = useState<
    Record<string, { batch_lot: string; available: number }[]>
  >({});
  const createdDate = new Date().toLocaleDateString();
  // Label maps so Select triggers show names, not raw UUID values.
  const warehouseItems = warehouses.map((w) => ({ value: w.id, label: w.name }));
  const skuItems = skus.map((s) => ({ value: s.id, label: s.name }));

  // Load in-stock batches for the chosen source warehouse and reset batch picks.
  useEffect(() => {
    if (!sourceWarehouseId) {
      setBatchesBySku({});
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('inventory')
        .select('sku_id, batch_lot, available_quantity')
        .eq('warehouse_id', sourceWarehouseId)
        .gt('available_quantity', 0)
        .order('batch_lot');
      if (!active) return;
      const map: Record<string, { batch_lot: string; available: number }[]> = {};
      (data ?? []).forEach(
        (row: { sku_id: string; batch_lot: string; available_quantity: number }) => {
          (map[row.sku_id] ||= []).push({
            batch_lot: row.batch_lot,
            available: row.available_quantity,
          });
        }
      );
      setBatchesBySku(map);
      setItems((prev: TransferLineItem[]) =>
        prev.map((it: TransferLineItem) => ({ ...it, batch_lot: '' }))
      );
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceWarehouseId]);

  function addItem() {
    setItems([...items, { sku_id: '', quantity: '', batch_lot: '' }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof TransferLineItem, value: string) {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  }

  // When an item is picked, auto-fill its batch; if only one batch exists, select it.
  function handleSkuChange(index: number, skuId: string) {
    const batches = batchesBySku[skuId] ?? [];
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      sku_id: skuId,
      batch_lot: batches.length === 1 ? batches[0].batch_lot : '',
    };
    setItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (sourceWarehouseId === destinationWarehouseId) {
        toast.error('Source and destination warehouses must be different');
        return;
      }

      const validItems = items
        .filter((item) => item.sku_id && item.batch_lot && parseInt(item.quantity, 10) > 0)
        .map((item) => ({
          sku_id: item.sku_id,
          quantity_dispatched: parseInt(item.quantity, 10),
          batch_lot: item.batch_lot,
        }));

      if (validItems.length === 0) {
        toast.error('Please add at least one valid line item');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Your session has expired. Please sign in again.');
        return;
      }

      // Create transfer order as a draft
      const { data: transfer, error: transferError } = await supabase
        .from('transfer_orders')
        .insert({
          source_warehouse_id: sourceWarehouseId,
          destination_warehouse_id: destinationWarehouseId,
          created_by: user.id,
          priority,
          expected_delivery_at: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : null,
          notes,
          status: 'draft',
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // Create transfer items
      const { error: itemsError } = await supabase.from('transfer_items').insert(
        validItems.map((item) => ({
          ...item,
          transfer_id: transfer.id,
        }))
      );

      if (itemsError) throw itemsError;

      // Submit for approval — routing (scale, required tier, SLA) computed server-side now items exist
      const { error: submitError } = await supabase.rpc('submit_transfer_for_approval', {
        p_transfer_id: transfer.id,
      });
      if (submitError) throw submitError;

      toast.success(`Transfer ${transfer.transfer_number} submitted for approval`);
      router.push(`/transfers/${transfer.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="source">Source Warehouse</Label>
          <Select items={warehouseItems} value={sourceWarehouseId} onValueChange={(value) => setSourceWarehouseId(value || '')} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination">Destination Warehouse</Label>
          <Select items={warehouseItems} value={destinationWarehouseId} onValueChange={(value) => setDestinationWarehouseId(value || '')} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select destination" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value || 'routine')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expected">Expected Delivery Date</Label>
          <Input
            id="expected"
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="created">Date Created</Label>
          <Input id="created" type="text" value={createdDate} readOnly disabled />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg">
            <div className="col-span-12 md:col-span-5 space-y-2">
              <Label className="text-xs">Item</Label>
              <Select items={skuItems} value={item.sku_id} onValueChange={(value) => handleSkuChange(index, value || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {skus.map((sku) => (
                    <SelectItem key={sku.id} value={sku.id}>
                      {sku.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-6 md:col-span-2 space-y-2">
              <Label className="text-xs">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
              />
            </div>

            <div className="col-span-6 md:col-span-3 space-y-2">
              <Label className="text-xs">Batch/Lot</Label>
              <Select
                value={item.batch_lot}
                onValueChange={(value) => updateItem(index, 'batch_lot', value || '')}
                disabled={!item.sku_id || (batchesBySku[item.sku_id]?.length ?? 0) === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !sourceWarehouseId
                        ? 'Select source first'
                        : !item.sku_id
                          ? 'Select item first'
                          : (batchesBySku[item.sku_id]?.length ?? 0) === 0
                            ? 'No stock at source'
                            : 'Select batch'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(batchesBySku[item.sku_id] ?? []).map(
                    (b: { batch_lot: string; available: number }) => (
                      <SelectItem key={b.batch_lot} value={b.batch_lot}>
                        {b.batch_lot} ({b.available} available)
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-12 md:col-span-2">
              {items.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={loading} className="bg-[#006B3F] hover:bg-[#024F2E]">
        {loading ? 'Creating...' : 'Create Transfer Order'}
      </Button>
    </form>
  );
}
