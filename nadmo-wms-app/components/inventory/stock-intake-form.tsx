'use client';

import { useState } from 'react';
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

interface StockIntakeFormProps {
  warehouses: Warehouse[];
  skus: Sku[];
}

export function StockIntakeForm({ warehouses, skus }: StockIntakeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [skuId, setSkuId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [batchLot, setBatchLot] = useState('DEFAULT');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        toast.error('Please enter a valid quantity');
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

      if (existing) {
        const { error } = await supabase
          .from('inventory')
          .update({
            quantity: existing.quantity + qty,
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
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch">Batch/Lot</Label>
          <Input id="batch" value={batchLot} onChange={(e) => setBatchLot(e.target.value)} required />
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

      <Button type="submit" disabled={loading} className="bg-[#006B3F] hover:bg-[#024F2E]">
        {loading ? 'Receiving...' : 'Receive Stock'}
      </Button>
    </form>
  );
}
