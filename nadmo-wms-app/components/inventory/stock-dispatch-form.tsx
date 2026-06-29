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
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const availableItems = useMemo(
    () => inventory.filter((item) => item.warehouse_id === warehouseId && item.available_quantity > 0),
    [inventory, warehouseId]
  );

  const selectedItem = useMemo(
    () => availableItems.find((item) => item.sku_id === skuId),
    [availableItems, skuId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        toast.error('Please enter a valid quantity');
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

      const newQuantity = selectedItem.quantity - qty;
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', selectedItem.id);

      if (error) throw error;

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
          <Select value={warehouseId} onValueChange={(value) => setWarehouseId(value || '')} required>
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
          <Select value={skuId} onValueChange={(value) => setSkuId(value || '')} required>
            <SelectTrigger>
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {availableItems.map((item) => (
                <SelectItem key={item.id} value={item.sku_id}>
                  {item.sku?.name} — {item.available_quantity} avail ({item.batch_lot})
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

      <Button type="submit" disabled={loading} className="bg-[#0066CC] hover:bg-[#0052a3]">
        {loading ? 'Dispatching...' : 'Dispatch Stock'}
      </Button>
    </form>
  );
}
