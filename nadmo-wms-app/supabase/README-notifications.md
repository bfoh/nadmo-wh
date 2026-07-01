# Notification delivery — activation runbook

Project ref: `epunhsuypjbhhjdsxupb`
Dispatcher URL: `https://epunhsuypjbhhjdsxupb.functions.supabase.co/dispatch-notifications`

Do these in order. Steps 2 & 3 need the Supabase CLI (`supabase link --project-ref epunhsuypjbhhjdsxupb`)
or the dashboard's Edge Functions editor.

---

## 1. Run the migration
Run `supabase/migrations/00022_notification_delivery.sql` in **SQL Editor**.
Verify: `select count(*) from notification_routing;` → 10.

## 2. Set Edge Function secrets (fill in your own keys)
```bash
supabase secrets set \
  BREVO_API_KEY=xkeysib-REPLACE_ME \
  BREVO_SENDER_EMAIL=REPLACE_with_your_verified_brevo_sender \
  BREVO_SENDER_NAME="NADMO-WMS" \
  ARKESEL_API_KEY=REPLACE_ME \
  ARKESEL_SENDER_ID=REPLACE_with_your_approved_sender_id \
  APP_URL=https://www.nadmo.org
```
(`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do not set them.)

## 3. Deploy the dispatcher
```bash
supabase functions deploy dispatch-notifications --no-verify-jwt
```

## 4. Enable pg_net + schedule the cron sweep
- Dashboard → **Database → Extensions** → enable **pg_net**.
- Then run in SQL Editor:
```sql
select cron.schedule(
  'dispatch-notifications-sweep', '* * * * *',
  $$ select net.http_post(
       url := 'https://epunhsuypjbhhjdsxupb.functions.supabase.co/dispatch-notifications',
       headers := '{"Content-Type":"application/json"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);
```

## 5. Create the Database Webhook (instant delivery)
Dashboard → **Database → Webhooks → Create a new hook**:
- Table: `notification_deliveries`, Events: **Insert**
- Type: **HTTP Request → POST**
- URL: `https://epunhsuypjbhhjdsxupb.functions.supabase.co/dispatch-notifications`
- No auth headers (JWT verification is off).

## 6. Test
App → **Profile → Send test**. Then check **Settings → Notification Delivery**, or:
```sql
select channel, status, provider, error
from notification_deliveries
order by created_at desc limit 5;
```

## Health / troubleshooting
```sql
-- pipeline state
select status, channel, count(*) from notification_deliveries group by 1,2 order by 1;
-- cron job present?
select jobname, schedule, active from cron.job where jobname='dispatch-notifications-sweep';
-- force a sweep now (instead of waiting for cron)
select net.http_post(
  url := 'https://epunhsuypjbhhjdsxupb.functions.supabase.co/dispatch-notifications',
  headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb);
```
Common failure reasons in the `error` column: Brevo sender not verified, Arkesel Sender ID
not approved, phone not in `+233…`/`0…` format.
