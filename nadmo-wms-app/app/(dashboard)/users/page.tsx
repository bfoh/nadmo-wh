import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { canManageUsers, assignableRoles, ROLE_LABELS } from '@/lib/auth';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import type { UserRole } from '@/types';

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  if (!profile || !canManageUsers(profile.role)) {
    redirect('/');
  }

  const [{ data: users }, { data: warehouses }, { data: regions }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('warehouses').select('id, name, type, region_id, code').order('name'),
    supabase.from('regions').select('id, name').order('name'),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">User Management</h1>
          <p className="text-muted-foreground">Create staff accounts and manage role assignments</p>
        </div>
        <CreateUserDialog
          assignable={assignableRoles(profile.role)}
          warehouses={warehouses ?? []}
          regions={regions ?? []}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users ({users?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <div className="divide-y">
              {users.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                      {(u.first_name?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-ink">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {ROLE_LABELS[u.role as UserRole] ?? u.role}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      u.is_active ? 'bg-ready-soft text-ready-foreground' : 'bg-neutral-soft text-ink-subtle'
                    }`}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No users found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
