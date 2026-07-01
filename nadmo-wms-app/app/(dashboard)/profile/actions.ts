'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface NotificationPrefsInput {
  email_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  category_overrides: Record<string, { email?: boolean; sms?: boolean }>;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function saveNotificationPreferences(
  input: NotificationPrefsInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { error } = await supabase.from('notification_preferences').upsert(
    {
      user_id: user.id,
      email_enabled: input.email_enabled,
      sms_enabled: input.sms_enabled,
      quiet_hours_start: input.quiet_hours_start,
      quiet_hours_end: input.quiet_hours_end,
      category_overrides: input.category_overrides,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath('/profile');
  return { ok: true };
}

/**
 * Queues a test notification through the real delivery pipeline, respecting the
 * user's master channel toggles. Uses the service role to write the outbox rows
 * (which authenticated users can't insert directly).
 */
export async function sendTestNotification(): Promise<ActionResult & { channels?: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', user.id)
    .single();

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('email_enabled, sms_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  const emailOn = prefs?.email_enabled ?? true;
  const smsOn = prefs?.sms_enabled ?? true;

  const admin = createAdminClient();
  const { data: notif, error: notifErr } = await admin
    .from('notifications')
    .insert({
      user_id: user.id,
      type: 'system',
      title: 'Test notification',
      message: 'This is a test of your NADMO-WMS notification settings.',
    })
    .select('id')
    .single();
  if (notifErr || !notif) return { ok: false, error: notifErr?.message ?? 'Failed to queue test.' };

  const rows: { notification_id: string; user_id: string; channel: string; recipient: string }[] = [];
  if (emailOn && profile?.email) {
    rows.push({ notification_id: notif.id, user_id: user.id, channel: 'email', recipient: profile.email });
  }
  if (smsOn && profile?.phone) {
    rows.push({ notification_id: notif.id, user_id: user.id, channel: 'sms', recipient: profile.phone });
  }
  if (rows.length === 0) {
    return { ok: false, error: 'No enabled channel with a contact on file (check email/phone).' };
  }

  const { error: delErr } = await admin.from('notification_deliveries').insert(rows);
  if (delErr) return { ok: false, error: delErr.message };

  return { ok: true, channels: rows.map((r) => r.channel) };
}
