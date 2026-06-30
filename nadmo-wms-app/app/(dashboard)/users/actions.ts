'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canManageUsers, assignableRoles, roleRequiresWarehouse } from '@/lib/auth';
import type { UserRole } from '@/types';

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  warehouseId?: string | null;
  password: string;
}

export interface CreateUserResult {
  ok: boolean;
  error?: string;
}

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  // 1. Verify the caller is an authorized admin.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!me || !canManageUsers(me.role)) {
    return { ok: false, error: 'You are not authorized to create users.' };
  }
  if (!assignableRoles(me.role).includes(input.role)) {
    return { ok: false, error: 'You are not allowed to assign that role.' };
  }

  // 2. Validate input.
  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!email || !firstName || !lastName) {
    return { ok: false, error: 'First name, last name and email are required.' };
  }
  if (!input.password || input.password.length < 8) {
    return { ok: false, error: 'Temporary password must be at least 8 characters.' };
  }
  if (roleRequiresWarehouse(input.role) && !input.warehouseId) {
    return { ok: false, error: 'This role must be assigned to a warehouse.' };
  }

  // 3. Create the auth user with the service-role client (the handle_new_user
  //    trigger creates the matching profile from the metadata).
  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, role: input.role },
  });
  if (createErr || !created?.user) {
    return { ok: false, error: createErr?.message ?? 'Failed to create the user.' };
  }
  const newUserId = created.user.id;

  // 4. Finalize the profile (force first-login reset) and assign a warehouse.
  await admin
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      role: input.role,
      phone: input.phone?.trim() || null,
      is_active: true,
      must_reset_password: true,
    })
    .eq('id', newUserId);

  if (input.warehouseId) {
    await admin.from('user_warehouses').insert({
      user_id: newUserId,
      warehouse_id: input.warehouseId,
      is_primary: true,
    });
  }

  // 5. Best-effort audit trail.
  await admin.from('audit_logs').insert({
    user_id: user.id,
    action: 'CREATE',
    entity_type: 'profiles',
    entity_id: newUserId,
    new_value: { email, role: input.role, warehouse_id: input.warehouseId ?? null },
  });

  revalidatePath('/users');
  return { ok: true };
}
