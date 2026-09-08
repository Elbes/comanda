'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { roundCurrency } from '@/lib/utils/currency';
import type {
  CloseAccountInput,
  CloseAccountResult,
  DivisaoTipo,
} from '@/lib/types/database';

export async function calculateCloseAccount(
  comandaId: string,
  divisionType: DivisaoTipo,
  personAmounts?: Record<string, number>
): Promise<CloseAccountResult> {
  const admin = createAdminClient();

  const { data: config } = await admin
    .from('establishment_config')
    .select('service_fee_percent')
    .limit(1)
    .single();

  const serviceFeePercent = Number(config?.service_fee_percent ?? 10);

  const { data: orders } = await admin
    .from('orders')
    .select('id, person_id, status')
    .eq('comanda_id', comandaId)
    .not('status', 'eq', 'cancelado');

  const orderIds = orders?.map((o) => o.id) ?? [];

  let subtotal = 0;
  const personSubtotals: Record<string, number> = {};

  if (orderIds.length > 0) {
    const { data: items } = await admin
      .from('order_items')
      .select('order_id, quantity, unit_price')
      .in('order_id', orderIds);

    const orderPersonMap = new Map(orders?.map((o) => [o.id, o.person_id]) ?? []);

    for (const item of items ?? []) {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      subtotal += itemTotal;
      const personId = orderPersonMap.get(item.order_id);
      if (personId) {
        personSubtotals[personId] = (personSubtotals[personId] ?? 0) + itemTotal;
      }
    }
  }

  subtotal = roundCurrency(subtotal);
  const serviceFeeAmount = roundCurrency(subtotal * (serviceFeePercent / 100));
  const total = roundCurrency(subtotal + serviceFeeAmount);

  const { data: people } = await admin
    .from('comanda_people')
    .select('id, name')
    .eq('comanda_id', comandaId);

  const personTotals: Record<string, number> = {};

  if (divisionType === 'igual' && people && people.length > 0) {
    const perPerson = roundCurrency(total / people.length);
    for (const p of people) {
      personTotals[p.name] = perPerson;
    }
  } else if (divisionType === 'por_pessoa') {
    for (const p of people ?? []) {
      const pSub = personSubtotals[p.id] ?? 0;
      const pFee = roundCurrency(pSub * (serviceFeePercent / 100));
      personTotals[p.name] = roundCurrency(pSub + pFee);
    }
  } else if (divisionType === 'livre' && personAmounts) {
    for (const [name, amount] of Object.entries(personAmounts)) {
      personTotals[name] = roundCurrency(amount);
    }
  }

  return {
    subtotal,
    serviceFeePercent,
    serviceFeeAmount,
    total,
    personTotals,
  };
}

export async function closeAccount(
  input: CloseAccountInput
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  const admin = createAdminClient();

  const { data: comanda } = await admin
    .from('comandas')
    .select('*, tables(*)')
    .eq('id', input.comandaId)
    .single();

  if (!comanda || comanda.status !== 'aberta') {
    return { success: false, error: 'Comanda não encontrada ou já fechada.' };
  }

  const calculation = await calculateCloseAccount(
    input.comandaId,
    input.divisionType,
    input.personAmounts
  );

  let closedByUserId: string | null = null;
  if (!input.closedByClient) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      closedByUserId = systemUser?.id ?? null;
    }
  }

  const { data: payment, error: paymentError } = await admin
    .from('payments')
    .insert({
      comanda_id: input.comandaId,
      division_type: input.divisionType,
      service_fee_percent: calculation.serviceFeePercent,
      subtotal: calculation.subtotal,
      service_fee_amount: calculation.serviceFeeAmount,
      total: calculation.total,
      payment_method: input.paymentMethod,
      closed_by_user_id: closedByUserId,
      closed_by_client: input.closedByClient ?? false,
      person_amounts: calculation.personTotals,
    })
    .select()
    .single();

  if (paymentError || !payment) {
    return { success: false, error: 'Erro ao registrar pagamento.' };
  }

  await admin
    .from('comandas')
    .update({ status: 'fechada', closed_at: new Date().toISOString() })
    .eq('id', input.comandaId);

  const { count: openCount } = await admin
    .from('comandas')
    .select('*', { count: 'exact', head: true })
    .eq('table_id', comanda.table_id)
    .eq('status', 'aberta');

  if (!openCount) {
    await admin.from('tables').update({ status: 'livre' }).eq('id', comanda.table_id);
  } else {
    await admin.from('tables').update({ status: 'ocupada' }).eq('id', comanda.table_id);
  }

  return { success: true, paymentId: payment.id };
}
