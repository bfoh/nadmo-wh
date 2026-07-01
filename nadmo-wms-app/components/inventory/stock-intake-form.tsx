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

interface StockIntakeFormProps {
  warehouses: Warehouse[];
  skus: Sku[];
  inventory: Inventory[];
}

export function StockIntakeForm({ warehouses, skus, inventory }: StockIntakeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [skuId, setSkuId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [batchLot, setBatchLot] = useState('DEFAULT');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');

  // Existing batches for the chosen warehouse + item, offered as suggestions
  // (you can still type a new batch number to receive a fresh lot).
  const existingBatches = useMemo(() => {
    const batches = inventory
      .filter((item) => item.warehouse_id === warehouseId && item.sku_id === skuId)
      .map((item) => item.batch_lot);
    return Array.from(new Set(batches));
  }, [inventory, warehouseId, skuId]);

  // Label maps so Select triggers show names, not raw UUID values.
  const warehouseItems = warehouses.map((w) => ({ value: w.id, label: w.name }));
  const skuItems = skus.map((s) => ({ value: s.id, label: `${s.name} (${s.unit_of_measure})` }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Your session has expired. Please sign in again.');
        return;
      }

      // Check if inventory row exists
      const { data: existing } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('warehouse_id', warehouseId)
        .eq('sku_id', skuId)
        .eq('batch_lot', batchLot)
        .maybeSingle();

      const quantityAfter = existing ? existing.quantity + qty : qty;

      if (existing) {
        const { error } = await supabase
          .from('inventory')
          .update({
            quantity: quantityAfter,
            expiry_date: expiryDate || null,
            storage_location: location || null,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('inventory').insert({
          warehouse_id: warehouseId,
          sku_id: skuId,
          batch_lot: batchLot,
          quantity: qty,
          expiry_date: expiryDate || null,
          storage_location: location || null,
        });

        if (error) throw error;
      }

      // Record the movement in the inventory ledger.
      await supabase.from('inventory_transactions').insert({
        warehouse_id: warehouseId,
        sku_id: skuId,
        batch_lot: batchLot,
        transaction_type: 'intake',
        quantity_change: qty,
        quantity_after: quantityAfter,
        performed_by: user.id,
      });

      toast.success('Stock received successfully');
      router.refresh();
      setQuantity('');
      setBatchLot('DEFAULT');
      setExpiryDate('');
      setLocation('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to receive stock');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="warehouse">Warehouse</Label>
          <Select items={warehouseItems} value={warehouseId} onValueChange={(value) => setWarehouseId(value || '')} required>
            <SelectTrigger className="w-full">
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
          <Select items={skuItems} value={skuId} onValueChange={(value) => setSkuId(value || '')} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {skus.map((sku) => (
                <SelectItem key={sku.id} value={sku.id}>
                  {sku.name} ({sku.unit_of_measure})
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
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch">Batch/Lot</Label>
          <Input
            id="batch"
            list="receive-batch-options"
            value={batchLot}
            onChange={(e) => setBatchLot(e.target.value)}
            placeholder="Select or type a batch number"
            required
          />
          <datalist id="receive-batch-options">
            {existingBatches.map((batch) => (
              <option key={batch} value={batch} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiry">Expiry Date (optional)</Label>
          <Input
            id="expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Storage Location (optional)</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-background py-3 -mx-4 px-4 border-t border-border lg:static lg:border-0 lg:mx-0 lg:px-0 lg:py-0">
        <Button type="submit" disabled={loading} className="w-full lg:w-auto active:scale-[0.98] transition-transform">
          {loading ? 'Receiving...' : 'Receive Stock'}
        </Button>
      </div>
    </form>
  );
}
