'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginStaff(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { success: false, error: 'E-mail ou senha inválidos.' };
  }

  const { data: systemUser } = await supabase
    .from('system_users')
    .select('role, active')
    .eq('auth_user_id', data.user.id)
    .single();

  if (!systemUser?.active) {
    await supabase.auth.signOut();
    return { success: false, error: 'Usuário inativo ou sem permissão.' };
  }

  const redirectMap: Record<string, string> = {
    garcom: '/garcom',
    balcao: '/balcao',
    gerencia: '/gerencia',
  };

  return { success: true, redirectTo: redirectMap[systemUser.role] };
}

export async function logoutStaff(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getCurrentStaffUser() {
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

  return systemUser;
}
