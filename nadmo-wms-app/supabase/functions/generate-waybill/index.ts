import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const transferId = url.searchParams.get('transfer_id');

    if (!transferId) {
      return new Response(JSON.stringify({ error: 'transfer_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: transfer, error } = await supabaseClient
      .from('transfer_orders')
      .select(
        '*, source_warehouse:source_warehouse_id(*), destination_warehouse:destination_warehouse_id(*), items:transfer_items(*, sku:sku_id(*))'
      )
      .eq('id', transferId)
      .single();

    if (error || !transfer) {
      return new Response(JSON.stringify({ error: 'Transfer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      transfer.transfer_number
    )}`;

    const itemsHtml = (transfer.items || [])
      .map(
        (item: any) => `
      <tr>
        <td>${item.sku?.name || 'Unknown'}</td>
        <td>${item.sku?.sku_code || '—'}</td>
        <td>${item.batch_lot}</td>
        <td style="text-align:center">${item.quantity_dispatched}</td>
      </tr>
    `
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Waybill - ${transfer.transfer_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #0F172A; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C41E3A; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #C41E3A; }
    .waybill-title { font-size: 20px; font-weight: bold; margin-top: 8px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #64748B; margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; font-size: 13px; }
    th { background: #F1F5F9; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
    .signature-line { border-top: 1px solid #0F172A; margin-top: 50px; padding-top: 8px; font-size: 13px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: #0066CC; color: white; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">NADMO</div>
      <div class="waybill-title">Digital Waybill</div>
      <div style="margin-top: 8px; font-size: 13px; color: #64748B;">${transfer.transfer_number}</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">${transfer.status.replace(/_/g, ' ').toUpperCase()}</span>
      <div style="margin-top: 12px;"><img src="${qrCodeUrl}" alt="QR Code" width="100"></div>
    </div>
  </div>

  <div class="grid">
    <div class="section">
      <div class="section-title">Source Warehouse</div>
      <div style="font-weight: bold;">${transfer.source_warehouse?.name}</div>
      <div style="font-size: 13px;">${transfer.source_warehouse?.address || ''}</div>
      <div style="font-size: 13px;">${transfer.source_warehouse?.phone || ''}</div>
    </div>
    <div class="section">
      <div class="section-title">Destination Warehouse</div>
      <div style="font-weight: bold;">${transfer.destination_warehouse?.name}</div>
      <div style="font-size: 13px;">${transfer.destination_warehouse?.address || ''}</div>
      <div style="font-size: 13px;">${transfer.destination_warehouse?.phone || ''}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Transport Details</div>
    <div style="font-size: 13px;"><strong>Vehicle:</strong> ${transfer.vehicle_registration || 'Not assigned'}</div>
    <div style="font-size: 13px;"><strong>Driver:</strong> ${transfer.driver_name || 'Not assigned'}</div>
    <div style="font-size: 13px;"><strong>Driver Phone:</strong> ${transfer.driver_phone || '—'}</div>
    <div style="font-size: 13px;"><strong>Expected Delivery:</strong> ${
      transfer.expected_delivery_at
        ? new Date(transfer.expected_delivery_at).toLocaleDateString('en-GB')
        : '—'
    }</div>
  </div>

  <div class="section">
    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU Code</th>
          <th>Batch/Lot</th>
          <th style="text-align:center">Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
  </div>

  ${transfer.notes ? `<div class="section"><div class="section-title">Notes</div><div style="font-size: 13px;">${transfer.notes}</div></div>` : ''}

  <div class="signatures">
    <div>
      <div class="signature-line">Dispatcher Signature & Date</div>
    </div>
    <div>
      <div class="signature-line">Receiver Signature & Date</div>
    </div>
  </div>

  <div style="margin-top: 40px; font-size: 11px; color: #64748B; text-align: center;">
    NADMO Integrated Warehouse & Logistics Management System • Generated electronically
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
