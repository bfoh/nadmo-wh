import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_LABELS } from '@/lib/auth';
import { NotificationPreferences } from '@/components/profile/notification-preferences';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  const [{ data: routing }, { data: prefs }] = await Promise.all([
    supabase.from('notification_routing').select('type, email, sms, critical'),
    supabase
      .from('notification_preferences')
      .select('email_enabled, sms_enabled, quiet_hours_start, quiet_hours_end, category_overrides')
      .eq('user_id', user?.id)
      .maybeSingle(),
  ]);

  const initialPrefs = {
    email_enabled: prefs?.email_enabled ?? true,
    sms_enabled: prefs?.sms_enabled ?? true,
    quiet_hours_start: prefs?.quiet_hours_start ?? null,
    quiet_hours_end: prefs?.quiet_hours_end ?? null,
    category_overrides: prefs?.category_overrides ?? {},
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">My Profile</h1>
        <p className="text-muted-foreground">View your account details</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Full Name</div>
              <div className="font-medium">
                {profile.first_name} {profile.last_name}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{profile.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Role</div>
              <div className="font-medium">{ROLE_LABELS[profile.role as import('@/types').UserRole]}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-medium">{profile.phone || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">MFA Status</div>
              <div className="font-medium">{profile.mfa_enabled ? 'Enabled' : 'Not enabled'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium">{profile.is_active ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <NotificationPreferences routing={routing ?? []} initial={initialPrefs} />
    </div>
  );
}
