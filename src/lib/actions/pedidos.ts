'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getClientSession } from '@/lib/actions/comanda';
import type { CartItem, LancadoPorTipo } from '@/lib/types/database';

export async function createPedido(
  items: CartItem[],
  launchedBy: LancadoPorTipo = 'cliente',
  personId?: string,
  comandaId?: string
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  if (!items.length) {
    return { success: false, error: 'Adicione itens ao pedido.' };
  }

  const admin = createAdminClient();
  let targetPersonId = personId;
  let targetComandaId = comandaId;
  let launchedByUserId: string | null = null;

  if (launchedBy === 'cliente') {
    const session = await getClientSession();
    if (!session.person || !session.comanda) {
      return { success: false, error: 'Sessão inválida.' };
    }
    targetPersonId = session.person.id;
    targetComandaId = session.comanda.id;
  } else {
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
      launchedByUserId = systemUser?.id ?? null;
    }
  }

  if (!targetPersonId || !targetComandaId) {
    return { success: false, error: 'Comanda ou pessoa não informada.' };
  }

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      comanda_id: targetComandaId,
      person_id: targetPersonId,
      status: 'pendente',
      launched_by: launchedBy,
      launched_by_user_id: launchedByUserId,
    })
    .select()
    .single();

  if (orderError || !order) {
    return { success: false, error: 'Erro ao criar pedido.' };
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
    unit_price: item.price,
    observation: item.observation || null,
  }));

  const { error: itemsError } = await admin.from('order_items').insert(orderItems);

  if (itemsError) {
    await admin.from('orders').delete().eq('id', order.id);
    return { success: false, error: 'Erro ao adicionar itens ao pedido.' };
  }

  return { success: true, orderId: order.id };
}

export async function getMyOrders() {
  const session = await getClientSession();
  if (!session.person || !session.comanda) {
    return { orders: [] as Array<Record<string, unknown>> };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from('orders')
    .select(`
      *,
      order_items(*, menu_item:menu_items(name, price))
    `)
    .eq('comanda_id', session.comanda.id)
    .eq('person_id', session.person.id)
    .order('created_at', { ascending: false });

  return { orders: data ?? [] };
}

export async function updatePedidoStatus(
  orderId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from('orders').update({ status }).eq('id', orderId);

  if (error) {
    return { success: false, error: 'Erro ao atualizar status.' };
  }
  return { success: true };
}

export async function cancelPedido(
  orderId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason.trim()) {
    return { success: false, error: 'Informe o motivo do cancelamento.' };
  }

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

  const { error } = await admin
    .from('orders')
    .update({ status: 'cancelado', cancel_reason: reason })
    .eq('id', orderId);

  if (error) {
    return { success: false, error: 'Erro ao cancelar pedido.' };
  }

  await admin.from('audit_logs').insert({
    action: 'cancel_pedido',
    entity_type: 'order',
    entity_id: orderId,
    user_id: systemUserId,
    reason,
  });

  return { success: true };
}

export async function advancePedidoStatus(
  orderId: string,
  currentStatus: string
): Promise<{ success: boolean; error?: string }> {
  const statusFlow: Record<string, string> = {
    pendente: 'em_preparo',
    em_preparo: 'pronto',
    pronto: 'entregue',
  };

  const nextStatus = statusFlow[currentStatus];
  if (!nextStatus) {
    return { success: false, error: 'Status inválido para avanço.' };
  }

  return updatePedidoStatus(orderId, nextStatus);
}
