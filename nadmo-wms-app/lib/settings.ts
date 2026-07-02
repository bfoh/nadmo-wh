import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Application settings, stored as key-value rows in the `settings` table
 * (migration 00023). These defaults are the source of truth until an admin
 * overrides them, and the fallback if the table is empty or missing.
 */
export const SETTING_DEFAULTS = {
  global_min_stock_threshold: '100',
  low_stock_warning_threshold: '500',
  critical_stock_threshold: '0',
  expiry_warning_days: '90',
  expiry_critical_days: '30',
  transfer_auto_approval_limit: '1000',
  require_approval_cross_region: 'true',
  require_approval_large: 'true',
  require_approval_hq_district: 'false',
  approval_chain: 'regional',
  notify_email: 'true',
  notify_sms: 'true',
  notify_in_app: 'true',
  sms_provider: 'arkesel',
  sms_sender_id: 'NADMO',
  date_format: 'DD/MM/YYYY',
  timezone: 'Africa/Accra',
  currency: 'GHS',
  items_per_page: '25',
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type SettingsMap = Record<SettingKey, string>;

/** Reads settings merged over defaults. Falls back to defaults on any error
 *  (e.g. the table not yet migrated) so the app never breaks. */
export async function getSettings(supabase: SupabaseClient): Promise<SettingsMap> {
  const map: SettingsMap = { ...SETTING_DEFAULTS };
  const { data, error } = await supabase.from('settings').select('key, value');
  if (!error && data) {
    for (const row of data as { key: string; value: string }[]) {
      if (row.key in map) map[row.key as SettingKey] = row.value;
    }
  }
  return map;
}

export const asBool = (v: string | undefined) => v === 'true';
export const asNum = (v: string | undefined, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
