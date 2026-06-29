import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get primary warehouse name
  const { data: primaryAssignments } = await supabase
    .from('user_warehouses')
    .select('warehouse_id, is_primary')
    .eq('user_id', profile.id)
    .eq('is_primary', true)
    .limit(1);

  let warehouseName: string | undefined;
  if (primaryAssignments && primaryAssignments.length > 0) {
    const { data: warehouse } = await supabase
      .from('warehouses')
      .select('name')
      .eq('id', primaryAssignments[0].warehouse_id)
      .single();
    warehouseName = warehouse?.name;
  }

  // Get unread notification count
  const { count: notificationCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('is_read', false);

  return (
    <AppShell
      profile={profile}
      warehouseName={warehouseName}
      notificationCount={notificationCount ?? 0}
    >
      {children}
    </AppShell>
  );
}
