'use client';

import { useState, useMemo } from 'react';
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
import { Inventory, Sku, Warehouse } from '@/types';

interface StockDispatchFormProps {
  warehouses: Warehouse[];
  skus: Sku[];
  inventory: Inventory[];
}

export function StockDispatchForm({ warehouses, inventory }: StockDispatchFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [skuId, setSkuId] = useState('');
  const [batchLot, setBatchLot] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const availableItems = useMemo(
    () => inventory.filter((item) => item.warehouse_id === warehouseId && item.available_quantity > 0),
    [inventory, warehouseId]
  );

  // Distinct items in stock at the chosen warehouse (one entry per SKU).
  const skuOptions = useMemo(() => {
    const seen = new Map<string, string>();
    availableItems.forEach((item) => {
      if (!seen.has(item.sku_id)) seen.set(item.sku_id, item.sku?.name ?? item.sku_id);
    });
    return Array.from(seen, ([sku_id, name]) => ({ sku_id, name }));
  }, [availableItems]);

  // Batches of the selected item available at the warehouse.
  const batchOptions = useMemo(
    () => availableItems.filter((item) => item.sku_id === skuId),
    [availableItems, skuId]
  );

  const selectedItem = useMemo(
    () => availableItems.find((item) => item.sku_id === skuId && item.batch_lot === batchLot),
    [availableItems, skuId, batchLot]
  );

  function handleWarehouseChange(value: string | null) {
    setWarehouseId(value || '');
    setSkuId('');
    setBatchLot('');
  }

  function handleSkuChange(value: string | null) {
    setSkuId(value || '');
    const batches = availableItems.filter((item) => item.sku_id === value);
    setBatchLot(batches.length === 1 ? batches[0].batch_lot : '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }

      if (!batchLot) {
        toast.error('Please select a batch');
        return;
      }

      if (!selectedItem) {
        toast.error('Selected item not found in warehouse');
        return;
      }

      if (qty > selectedItem.available_quantity) {
        toast.error(`Only ${selectedItem.available_quantity} units available`);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Your session has expired. Please sign in again.');
        return;
      }

      const newQuantity = selectedItem.quantity - qty;
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', selectedItem.id);

      if (error) throw error;

      // Record the movement in the inventory ledger.
      await supabase.from('inventory_transactions').insert({
        warehouse_id: warehouseId,
        sku_id: skuId,
        batch_lot: batchLot,
        transaction_type: 'dispatch',
        quantity_change: -qty,
        quantity_after: newQuantity,
        reason_notes: reason || null,
        performed_by: user.id,
      });

      toast.success('Stock dispatched successfully');
      router.refresh();
      setQuantity('');
      setReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to dispatch stock');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="warehouse">From Warehouse</Label>
          <Select value={warehouseId} onValueChange={handleWarehouseChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Select warehouse" />
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
          <Label htmlFor="sku">Item</Label>
          <Select value={skuId} onValueChange={handleSkuChange} required disabled={!warehouseId}>
            <SelectTrigger>
              <SelectValue placeholder={warehouseId ? 'Select item' : 'Select warehouse first'} />
            </SelectTrigger>
            <SelectContent>
              {skuOptions.map((option) => (
                <SelectItem key={option.sku_id} value={option.sku_id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch">Batch/Lot</Label>
          <Select
            value={batchLot}
            onValueChange={(value) => setBatchLot(value || '')}
            disabled={!skuId || batchOptions.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={skuId ? 'Select batch' : 'Select item first'} />
            </SelectTrigger>
            <SelectContent>
              {batchOptions.map((item) => (
                <SelectItem key={item.id} value={item.batch_lot}>
                  {item.batch_lot} ({item.available_quantity} available)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={selectedItem?.available_quantity || 1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          {selectedItem && (
            <p className="text-xs text-muted-foreground">
              Available: {selectedItem.available_quantity} {selectedItem.sku?.unit_of_measure}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Field distribution"
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="bg-[#006B3F] hover:bg-[#024F2E]">
        {loading ? 'Dispatching...' : 'Dispatch Stock'}
      </Button>
    </form>
  );
}
