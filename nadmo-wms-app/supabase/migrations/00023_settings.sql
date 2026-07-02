-- Key-value application settings, editable by admins via the Settings UI and
-- read across the app (thresholds, approval rules, formats).

create table if not exists public.settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

alter table public.settings enable row level security;

-- Any authenticated user may read settings.
drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings
  for select to authenticated using (true);

-- Only admins (dg / sysadmin / hq_admin) may create or update settings.
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('dg', 'sysadmin', 'hq_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('dg', 'sysadmin', 'hq_admin')
    )
  );

grant select, insert, update on public.settings to authenticated;

insert into public.settings (key, value, description) values
  ('global_min_stock_threshold', '100', 'Global minimum stock threshold'),
  ('low_stock_warning_threshold', '500', 'Low stock warning level'),
  ('critical_stock_threshold', '0', 'Critical stock threshold'),
  ('expiry_warning_days', '90', 'Days before expiry to warn'),
  ('expiry_critical_days', '30', 'Days before expiry for critical alert'),
  ('transfer_auto_approval_limit', '1000', 'Transfers below this amount auto-approve'),
  ('require_approval_cross_region', 'true', 'Require approval for cross-region transfers'),
  ('require_approval_large', 'true', 'Require approval for large transfers'),
  ('require_approval_hq_district', 'false', 'Require approval for HQ to district transfers'),
  ('approval_chain', 'regional', 'Approval chain: auto | regional | dg'),
  ('notify_email', 'true', 'Email notifications enabled'),
  ('notify_sms', 'true', 'SMS notifications enabled'),
  ('notify_in_app', 'true', 'In-app notifications enabled'),
  ('sms_provider', 'arkesel', 'SMS gateway provider'),
  ('sms_sender_id', 'NADMO', 'SMS sender ID'),
  ('date_format', 'DD/MM/YYYY', 'Display date format'),
  ('timezone', 'Africa/Accra', 'Default time zone'),
  ('currency', 'GHS', 'Display currency'),
  ('items_per_page', '25', 'Default table page size')
on conflict (key) do nothing;
