'use server';

import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE } from '@/lib/utils/constants';
import type { Table, Comanda, ComandaPerson } from '@/lib/types/database';

export interface JoinComandaResult {
  success: boolean;
  error?: string;
  person?: ComandaPerson;
  comanda?: Comanda;
  table?: Table;
}

export async function joinComanda(
  tableToken: string,
  personName: string
): Promise<JoinComandaResult> {
  const admin = createAdminClient();
  const name = personName.trim();

  if (!name || name.length < 2) {
    return { success: false, error: 'Informe um nome válido (mínimo 2 caracteres).' };
  }

  const { data: table, error: tableError } = await admin
    .from('tables')
    .select('*')
    .eq('token', tableToken)
    .single();

  if (tableError || !table) {
    return { success: false, error: 'Mesa não encontrada.' };
  }

  if (table.status === 'bloqueada') {
    return { success: false, error: 'Esta mesa está bloqueada. Chame o garçom.' };
  }

  if (table.status === 'aguardando_pagamento') {
    return {
      success: false,
      error: 'Esta mesa está aguardando pagamento. Chame o garçom.',
    };
  }

  let comanda: Comanda | null = null;

  if (table.status === 'livre') {
    const { data: newComanda, error: comandaError } = await admin
      .from('comandas')
      .insert({
        table_id: table.id,
        status: 'aberta',
        opened_by: 'cliente',
      })
      .select()
      .single();

    if (comandaError || !newComanda) {
      return { success: false, error: 'Erro ao abrir comanda.' };
    }

    await admin
      .from('tables')
      .update({ status: 'ocupada' })
      .eq('id', table.id);

    comanda = newComanda;
  } else {
    const { data: existingComanda } = await admin
      .from('comandas')
      .select('*')
      .eq('table_id', table.id)
      .eq('status', 'aberta')
      .single();

    if (!existingComanda) {
      return { success: false, error: 'Comanda não encontrada para esta mesa.' };
    }
    comanda = existingComanda;
  }

  if (!comanda) {
    return { success: false, error: 'Erro ao abrir comanda.' };
  }

  const { data: person, error: personError } = await admin
    .from('comanda_people')
    .insert({
      comanda_id: comanda.id,
      name,
    })
    .select()
    .single();

  if (personError || !person) {
    return { success: false, error: 'Erro ao registrar pessoa na comanda.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, person.session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: '/',
  });

  return {
    success: true,
    person,
    comanda,
    table: { ...table, status: 'ocupada' },
  };
}

export async function getTableByToken(token: string): Promise<Table | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('tables').select('*').eq('token', token).single();
  return data;
}

export async function getClientSession(): Promise<{
  person: ComandaPerson | null;
  comanda: Comanda | null;
  table: Table | null;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return { person: null, comanda: null, table: null };
  }

  const admin = createAdminClient();

  const { data: person } = await admin
    .from('comanda_people')
    .select('*')
    .eq('session_token', sessionToken)
    .single();

  if (!person) {
    return { person: null, comanda: null, table: null };
  }

  const { data: comanda } = await admin
    .from('comandas')
    .select('*')
    .eq('id', person.comanda_id)
    .single();

  if (!comanda || comanda.status !== 'aberta') {
    return { person: null, comanda: null, table: null };
  }

  const { data: table } = await admin
    .from('tables')
    .select('*')
    .eq('id', comanda.table_id)
    .single();

  return { person, comanda, table };
}

export async function requestPayment(): Promise<{ success: boolean; error?: string }> {
  const { comanda, table } = await getClientSession();

  if (!comanda || !table) {
    return { success: false, error: 'Sessão inválida.' };
  }

  const admin = createAdminClient();

  await admin
    .from('tables')
    .update({ status: 'aguardando_pagamento' })
    .eq('id', table.id);

  return { success: true };
}
