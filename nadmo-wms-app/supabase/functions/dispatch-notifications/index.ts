// Dispatcher: sends pending notification_deliveries via Brevo (email) and
// Arkesel (SMS). Invoked by the Database Webhook (on new deliveries) and by a
// pg_cron sweep (retries). Idempotent — it atomically claims a batch, so the
// two triggers never double-send.
//
// Deploy:  supabase functions deploy dispatch-notifications
// Secrets: supabase secrets set BREVO_API_KEY=... BREVO_SENDER_EMAIL=... \
//            BREVO_SENDER_NAME="NADMO-WMS" ARKESEL_API_KEY=... \
//            ARKESEL_SENDER_ID=NADMO APP_URL=https://www.nadmo.org

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL');
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') ?? 'NADMO-WMS';
const ARKESEL_API_KEY = Deno.env.get('ARKESEL_API_KEY');
const ARKESEL_SENDER_ID = Deno.env.get('ARKESEL_SENDER_ID') ?? 'NADMO';
const APP_URL = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '');

interface Delivery {
  id: string;
  notification_id: string;
  channel: 'sms' | 'email';
  recipient: string;
}
interface Notif {
  id: string;
  type: string;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
}
interface SendResult {
  ok: boolean;
  id: string | null;
  error: string | null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function deepLink(n: Notif): string {
  if (!APP_URL) return '';
  if (n.related_entity_type === 'transfer_order' && n.related_entity_id) {
    return `${APP_URL}/transfers/${n.related_entity_id}`;
  }
  if (['critical_stock', 'amber_stock', 'expiry_warning', 'discrepancy', 'overdue_shipment'].includes(n.type)) {
    return `${APP_URL}/alerts`;
  }
  return APP_URL;
}

function normalizeGhanaPhone(raw: string): string {
  let p = raw.replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (p.startsWith('233')) return p;
  if (p.startsWith('0')) return '233' + p.slice(1);
  if (p.length === 9) return '233' + p;
  return p;
}

function smsText(title: string, message: string): string {
  const body = `${title}: ${message}`;
  return body.length > 155 ? body.slice(0, 154) + '…' : body;
}

function emailHtml(title: string, message: string, link: string): string {
  const button = link
    ? `<tr><td style="padding:8px 24px 24px">
         <a href="${link}" style="display:inline-block;background:#006B3F;color:#fff;text-decoration:none;
            padding:10px 20px;border-radius:8px;font-weight:600;font-size:14px">Open NADMO-WMS</a>
       </td></tr>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0">
      <tr><td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <tr><td style="background:#006B3F;padding:16px 24px;color:#fff;font-weight:700;font-size:16px">
            NADMO-WMS <span style="opacity:.8;font-weight:400">| Warehouse &amp; Logistics</span>
          </td></tr>
          <tr><td style="padding:24px 24px 8px;font-size:18px;font-weight:700;color:#0F172A">${title}</td></tr>
          <tr><td style="padding:0 24px 16px;font-size:14px;line-height:1.5;color:#334155">${message}</td></tr>
          ${button}
          <tr><td style="padding:16px 24px;background:#f8fafc;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0">
            National Disaster Management Organisation — automated notification. Do not reply.
          </td></tr>
        </table>
      </td></tr>
    </table></body></html>`;
}

async function sendEmail(to: string, n: Notif): Promise<SendResult> {
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) return { ok: false, id: null, error: 'brevo_not_configured' };
  const link = deepLink(n);
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject: n.title,
      htmlContent: emailHtml(n.title, n.message, link),
      textContent: `${n.title}\n\n${n.message}${link ? `\n\n${link}` : ''}`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    id: (data as any)?.messageId ? String((data as any).messageId) : null,
    error: res.ok ? null : JSON.stringify(data).slice(0, 500),
  };
}

async function sendSms(phone: string, n: Notif): Promise<SendResult> {
  if (!ARKESEL_API_KEY) return { ok: false, id: null, error: 'arkesel_not_configured' };
  const res = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
    method: 'POST',
    headers: { 'api-key': ARKESEL_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: ARKESEL_SENDER_ID,
      message: smsText(n.title, n.message),
      recipients: [normalizeGhanaPhone(phone)],
    }),
  });
  const data = await res.json().catch(() => ({}));
  const ok = res.ok && ((data as any)?.status === 'success' || (data as any)?.code === 'ok');
  const rawId = (data as any)?.data?.[0]?.id ?? (data as any)?.data?.id ?? null;
  return { ok, id: rawId ? String(rawId) : null, error: ok ? null : JSON.stringify(data).slice(0, 500) };
}

Deno.serve(async () => {
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: 'server_not_configured' }, 500);
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: batch, error } = await supabase.rpc('claim_pending_deliveries', { p_limit: 50 });
  if (error) return json({ error: error.message }, 500);
  const deliveries = (batch ?? []) as Delivery[];
  if (deliveries.length === 0) return json({ processed: 0, sent: 0, failed: 0 });

  const notifIds = [...new Set(deliveries.map((d) => d.notification_id))];
  const { data: notifs } = await supabase
    .from('notifications')
    .select('id, type, title, message, related_entity_type, related_entity_id')
    .in('id', notifIds);
  const notifMap = new Map((notifs ?? []).map((n: any) => [n.id, n as Notif]));

  let sent = 0;
  let failed = 0;
  for (const d of deliveries) {
    const n = notifMap.get(d.notification_id);
    let result: SendResult;
    let provider: string;
    try {
      if (!n) {
        result = { ok: false, id: null, error: 'notification_missing' };
        provider = d.channel === 'email' ? 'brevo' : 'arkesel';
      } else if (d.channel === 'email') {
        provider = 'brevo';
        result = await sendEmail(d.recipient, n);
      } else {
        provider = 'arkesel';
        result = await sendSms(d.recipient, n);
      }
    } catch (e) {
      provider = d.channel === 'email' ? 'brevo' : 'arkesel';
      result = { ok: false, id: null, error: String(e).slice(0, 500) };
    }

    await supabase.rpc('mark_delivery_result', {
      p_id: d.id,
      p_ok: result.ok,
      p_provider: provider,
      p_provider_message_id: result.id,
      p_error: result.error,
    });
    result.ok ? sent++ : failed++;
  }

  return json({ processed: deliveries.length, sent, failed });
});
