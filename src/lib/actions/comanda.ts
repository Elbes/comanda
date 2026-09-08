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

  if (table.status === 'livre' || table.status === 'aguardando_pagamento') {
    await admin.from('tables').update({ status: 'ocupada' }).eq('id', table.id);
  }

  const comanda = newComanda;

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
  const { person, comanda, table } = await getClientSession();

  if (!person || !comanda || !table) {
    return { success: false, error: 'Sessão inválida.' };
  }

  if (comanda.status !== 'aberta') {
    return { success: false, error: 'Comanda já está fechada.' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('tables')
    .update({ status: 'aguardando_pagamento' })
    .eq('id', table.id);

  if (error) {
    return { success: false, error: 'Erro ao solicitar a conta.' };
  }

  await admin.from('audit_logs').insert({
    action: 'request_payment',
    entity_type: 'table',
    entity_id: table.id,
    session_token: person.session_token,
    metadata: {
      comanda_id: comanda.id,
      person_id: person.id,
      person_name: person.name,
      table_number: table.number,
    },
  });

  return { success: true };
}
