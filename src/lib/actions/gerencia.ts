'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireGerencia } from '@/lib/auth/staff';
import type { MesaStatus, UserRole } from '@/lib/types/database';

export async function createMesa(
  number: number,
  capacity: number
): Promise<{ success: boolean; error?: string; tableId?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tables')
    .insert({ number, capacity })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe uma mesa com este número.' };
    }
    return { success: false, error: 'Erro ao criar mesa.' };
  }
  return { success: true, tableId: data.id };
}

export async function updateMesa(
  id: string,
  data: { number?: number; capacity?: number; status?: MesaStatus }
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from('tables').update(data).eq('id', id);
  if (error) return { success: false, error: 'Erro ao atualizar mesa.' };
  return { success: true };
}

export async function deleteMesa(id: string): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from('tables').delete().eq('id', id);
  if (error) return { success: false, error: 'Erro ao remover mesa.' };
  return { success: true };
}

export async function regenerateTableToken(
  id: string
): Promise<{ success: boolean; error?: string; token?: string }> {
  const admin = createAdminClient();
  const newToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const { data, error } = await admin
    .from('tables')
    .update({ token: newToken })
    .eq('id', id)
    .select('token')
    .single();

  if (error) return { success: false, error: 'Erro ao regenerar token.' };

  await admin.from('audit_logs').insert({
    action: 'regenerate_table_token',
    entity_type: 'table',
    entity_id: id,
    reason: 'Token regenerado pela gerência',
  });

  return { success: true, token: data.token };
}

export async function toggleMesaBlock(
  id: string,
  block: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let systemUserId: string | null = null;
  if (user) {
    const { data: systemUser } = await supabase
      .from('system_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    systemUserId = systemUser?.id ?? null;
  }

  const admin = createAdminClient();
  const newStatus: MesaStatus = block ? 'bloqueada' : 'livre';

  const { data: table } = await admin.from('tables').select('status').eq('id', id).single();
  if (table?.status === 'ocupada' && block) {
    return { success: false, error: 'Não é possível bloquear mesa ocupada.' };
  }

  const { error } = await admin.from('tables').update({ status: newStatus }).eq('id', id);
  if (error) return { success: false, error: 'Erro ao alterar status da mesa.' };

  await admin.from('audit_logs').insert({
    action: block ? 'block_table' : 'unblock_table',
    entity_type: 'table',
    entity_id: id,
    user_id: systemUserId,
    reason: reason ?? null,
  });

  return { success: true };
}

export async function openComandaByStaff(
  tableId: string,
  peopleNames: string[]
): Promise<{ success: boolean; error?: string; comandaId?: string }> {
  const admin = createAdminClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let systemUserId: string | null = null;
  if (user) {
    const { data: systemUser } = await supabase
      .from('system_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    systemUserId = systemUser?.id ?? null;
  }

  const { data: table } = await admin.from('tables').select('*').eq('id', tableId).single();
  if (!table) return { success: false, error: 'Mesa não encontrada.' };
  if (table.status === 'bloqueada') {
    return { success: false, error: 'Mesa bloqueada.' };
  }

  const validNames = peopleNames.filter((n) => n.trim().length >= 2);
  if (validNames.length === 0) {
    return { success: false, error: 'Informe o nome da pessoa.' };
  }

  let lastComandaId: string | undefined;

  for (const personName of validNames) {
    const { data: comanda, error } = await admin
      .from('comandas')
      .insert({
        table_id: tableId,
        status: 'aberta',
        opened_by: 'garcom',
        opened_by_user_id: systemUserId,
      })
      .select()
      .single();

    if (error || !comanda) return { success: false, error: 'Erro ao abrir comanda.' };
    lastComandaId = comanda.id;

    const { error: personError } = await admin.from('comanda_people').insert({
      comanda_id: comanda.id,
      name: personName.trim(),
    });

    if (personError) {
      return { success: false, error: 'Erro ao cadastrar pessoa na comanda.' };
    }
  }

  if (table.status === 'livre' || table.status === 'aguardando_pagamento') {
    await admin.from('tables').update({ status: 'ocupada' }).eq('id', tableId);
  }

  return { success: true, comandaId: lastComandaId };
}

export async function addPersonToComanda(
  comandaId: string,
  name: string
): Promise<{ success: boolean; error?: string; personId?: string; comandaId?: string }> {
  const admin = createAdminClient();
  const { data: current } = await admin
    .from('comandas')
    .select('table_id')
    .eq('id', comandaId)
    .single();

  if (!current) return { success: false, error: 'Comanda não encontrada.' };

  const result = await openComandaByStaff(current.table_id, [name]);
  if (!result.success) return result;
  return { success: true, comandaId: result.comandaId };
}

async function insertSystemUser(
  email: string,
  password: string,
  name: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data: authData, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createUserError || !authData.user) {
    return { success: false, error: createUserError?.message ?? 'Erro ao criar usuário.' };
  }

  const { error } = await admin.from('system_users').insert({
    auth_user_id: authData.user.id,
    name,
    role,
  });

  if (error) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: 'Erro ao vincular usuário ao sistema.' };
  }

  return { success: true };
}

export async function createSystemUser(
  email: string,
  password: string,
  name: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const { staff, error: authError } = await requireGerencia();
  if (!staff) {
    return { success: false, error: authError ?? 'Sem permissão.' };
  }

  return insertSystemUser(email, password, name, role);
}

export async function toggleUserActive(
  userId: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  const { staff, error: authError } = await requireGerencia();
  if (!staff) {
    return { success: false, error: authError ?? 'Sem permissão.' };
  }

  if (staff.systemUser.id === userId && !active) {
    return { success: false, error: 'Você não pode desativar a si mesmo.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.from('system_users').update({ active }).eq('id', userId);

  if (error) return { success: false, error: 'Erro ao atualizar usuário.' };
  return { success: true };
}

export async function updateEstablishmentConfig(data: {
  name?: string;
  service_fee_percent?: number;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
}): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: config } = await admin.from('establishment_config').select('id').limit(1).single();

  if (!config) {
    const { error } = await admin.from('establishment_config').insert(data);
    if (error) return { success: false, error: 'Erro ao criar configuração.' };
  } else {
    const { error } = await admin.from('establishment_config').update(data).eq('id', config.id);
    if (error) return { success: false, error: 'Erro ao atualizar configuração.' };
  }

  return { success: true };
}

export async function toggleMenuItemAvailability(
  itemId: string,
  available: boolean
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from('menu_items').update({ available }).eq('id', itemId);
  if (error) return { success: false, error: 'Erro ao atualizar item.' };
  return { success: true };
}

export async function createMenuCategory(
  name: string,
  displayOrder: number
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from('menu_categories').insert({ name, display_order: displayOrder });
  if (error) return { success: false, error: 'Erro ao criar categoria.' };
  return { success: true };
}

export async function createMenuItem(data: {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  display_order?: number;
}): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from('menu_items').insert(data);
  if (error) return { success: false, error: 'Erro ao criar item.' };
  return { success: true };
}

export async function updateMenuItem(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    category_id: string;
    available: boolean;
    display_order: number;
  }>
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from('menu_items').update(data).eq('id', id);
  if (error) return { success: false, error: 'Erro ao atualizar item.' };
  return { success: true };
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from('menu_items').delete().eq('id', id);
  if (error) return { success: false, error: 'Erro ao remover item.' };
  return { success: true };
}

export async function deleteMenuCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from('menu_categories').delete().eq('id', id);
  if (error) return { success: false, error: 'Erro ao remover categoria.' };
  return { success: true };
}

export async function setupInitialAdmin(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const { count } = await admin
    .from('system_users')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    return { success: false, error: 'Sistema já possui usuários cadastrados.' };
  }

  return insertSystemUser(email, password, name, 'gerencia');
}
