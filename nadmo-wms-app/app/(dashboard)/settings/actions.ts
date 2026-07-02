'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { canManageUsers } from '@/lib/auth';
import { SETTING_DEFAULTS, type SettingsMap } from '@/lib/settings';

export async function saveSettings(
  values: Partial<SettingsMap>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!me || !canManageUsers(me.role)) {
    return { ok: false, error: 'You are not authorized to change settings.' };
  }

  const now = new Date().toISOString();
  const rows = Object.entries(values)
    .filter(([key]) => key in SETTING_DEFAULTS)
    .map(([key, value]) => ({ key, value: String(value), updated_by: user.id, updated_at: now }));

  if (rows.length === 0) return { ok: true };

  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) {
    return {
      ok: false,
      error: error.message.includes('settings')
        ? 'Settings table not found. Run migration 00023_settings.sql, then try again.'
        : error.message,
    };
  }

  revalidatePath('/settings');
  return { ok: true };
}
