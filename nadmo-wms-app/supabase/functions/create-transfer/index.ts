import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface TransferItemInput {
  sku_id: string;
  quantity_dispatched: number;
  batch_lot?: string;
}

interface TransferPayload {
  source_warehouse_id: string;
  destination_warehouse_id: string;
  items: TransferItemInput[];
  priority?: 'routine' | 'urgent' | 'emergency';
  expected_delivery_at?: string;
  notes?: string;
}

function determineScale(totalQuantity: number): string {
  if (totalQuantity < 100) return 'routine';
  if (totalQuantity < 500) return 'standard';
  if (totalQuantity < 2000) return 'large';
  return 'strategic';
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload: TransferPayload = await req.json();

    if (payload.source_warehouse_id === payload.destination_warehouse_id) {
      return new Response(
        JSON.stringify({ error: 'Source and destination warehouses must be different' }),
        { status: 400 }
      );
    }

    if (!payload.items || payload.items.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one item is required' }), {
        status: 400,
      });
    }

    const totalQuantity = payload.items.reduce((sum, item) => sum + item.quantity_dispatched, 0);
    const scale = determineScale(totalQuantity);

    // Create transfer order
    const { data: transfer, error: transferError } = await supabaseClient
      .from('transfer_orders')
      .insert({
        source_warehouse_id: payload.source_warehouse_id,
        destination_warehouse_id: payload.destination_warehouse_id,
        created_by: user.id,
        priority: payload.priority || 'routine',
        scale,
        expected_delivery_at: payload.expected_delivery_at || null,
        notes: payload.notes || null,
        status: 'pending_approval',
      })
      .select()
      .single();

    if (transferError) throw transferError;

    const { error: itemsError } = await supabaseClient.from('transfer_items').insert(
      payload.items.map((item) => ({
        transfer_id: transfer.id,
        sku_id: item.sku_id,
        quantity_dispatched: item.quantity_dispatched,
        batch_lot: item.batch_lot || 'DEFAULT',
      }))
    );

    if (itemsError) throw itemsError;

    return new Response(JSON.stringify({ transfer }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
