# Notification delivery — activation runbook

Project ref: `epunhsuypjbhhjdsxupb`
Dispatcher URL: `https://epunhsuypjbhhjdsxupb.functions.supabase.co/dispatch-notifications`

Do these in order. Steps 2 & 3 can be done in the **dashboard** (no CLI needed):
- Secrets: **Edge Functions → Secrets** (`/project/epunhsuypjbhhjdsxupb/functions/secrets`)
- Deploy: **Edge Functions → Deploy a new function**, name it `dispatch-notifications`, paste
  `supabase/functions/dispatch-notifications/index.ts`, and turn **Verify JWT off**.
CLI equivalents are shown below.

---

## 1. Run the migration
Run `supabase/migrations/00022_notification_delivery.sql` in **SQL Editor**.
Verify: `select count(*) from notification_routing;` → 10.

## 2. Set Edge Function secrets
**Dashboard → Edge Functions → Secrets → Add new secret** (add each row):
`BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (your verified sender), `BREVO_SENDER_NAME` = `NADMO-WMS`,
`ARKESEL_API_KEY`, `ARKESEL_SENDER_ID` (approved id), `APP_URL` = `https://www.nadmo.org`.
Do **not** add `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — injected automatically.

CLI equivalent:
```bash
supabase secrets set BREVO_API_KEY=... BREVO_SENDER_EMAIL=... BREVO_SENDER_NAME="NADMO-WMS" \
  ARKESEL_API_KEY=... ARKESEL_SENDER_ID=... APP_URL=https://www.nadmo.org
```

## 3. Deploy the dispatcher
Dashboard: **Edge Functions → Deploy a new function**, name `dispatch-notifications`,
paste `supabase/functions/dispatch-notifications/index.ts`, **Verify JWT off**.
CLI equivalent:
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

## 5. Instant delivery trigger (SQL — replaces the dashboard "Database Webhook")
Newer dashboards moved Webhooks under **Integrations**; instead just create the
equivalent trigger in SQL (needs pg_net from step 4):
```sql
create or replace function public.dispatch_on_new_delivery()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://epunhsuypjbhhjdsxupb.functions.supabase.co/dispatch-notifications',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  return null;
end;
$$;

drop trigger if exists trg_dispatch_on_new_delivery on public.notification_deliveries;
create trigger trg_dispatch_on_new_delivery
  after insert on public.notification_deliveries
  for each statement execute function public.dispatch_on_new_delivery();
```

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
