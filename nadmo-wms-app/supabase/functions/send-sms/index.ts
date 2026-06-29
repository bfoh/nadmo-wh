import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface SmsPayload {
  user_id: string;
  phone: string;
  message: string;
  notification_id?: string;
}

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { phone, message, notification_id }: SmsPayload = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: 'Phone and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ARKESEL_API_KEY');
    if (!apiKey) {
      // Log and update notification if SMS is not configured
      if (notification_id) {
        await supabaseClient
          .from('notifications')
          .update({ external_status: 'sms_not_configured' })
          .eq('id', notification_id);
      }
      return new Response(
        JSON.stringify({ warning: 'Arkesel API key not configured; SMS skipped' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://sms.arkesel.com/sms/api?action=send-sms&api_key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: [phone],
        sender_id: 'NADMO-WMS',
        message,
      }),
    });

    const result = await response.json();

    if (notification_id) {
      await supabaseClient
        .from('notifications')
        .update({
          external_status: response.ok ? 'sent' : 'failed',
          external_response: JSON.stringify(result),
        })
        .eq('id', notification_id);
    }

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
