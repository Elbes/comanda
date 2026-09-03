import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types/database';

const STAFF_ROLES: UserRole[] = ['garcom', 'balcao', 'gerencia'];

export async function getStaffUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: systemUser } = await supabase
    .from('system_users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!systemUser?.active) return null;

  return { authUser: user, systemUser };
}

export async function requireStaffRole(allowedRoles: UserRole[]) {
  const staff = await getStaffUser();

  if (!staff) {
    return { staff: null, error: 'Não autenticado.' as const };
  }

  if (!allowedRoles.includes(staff.systemUser.role)) {
    return { staff: null, error: 'Sem permissão.' as const };
  }

  return { staff, error: null };
}

export async function requireGerencia() {
  return requireStaffRole(['gerencia']);
}

export async function requireCounterAccess() {
  return requireStaffRole(['balcao', 'gerencia']);
}

export function isStaffRole(role: string): role is UserRole {
  return STAFF_ROLES.includes(role as UserRole);
}
