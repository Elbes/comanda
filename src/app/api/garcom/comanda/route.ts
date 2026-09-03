import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const tableId = request.nextUrl.searchParams.get('tableId');
  if (!tableId) {
    return NextResponse.json({ comandas: [] });
  }

  const admin = createAdminClient();

  const { data: comandas } = await admin
    .from('comandas')
    .select('*')
    .eq('table_id', tableId)
    .eq('status', 'aberta')
    .order('opened_at', { ascending: true });

  const list = comandas ?? [];
  if (list.length === 0) {
    return NextResponse.json({ comandas: [] });
  }

  const comandaIds = list.map((comanda) => comanda.id);

  const { data: people } = await admin
    .from('comanda_people')
    .select('*')
    .in('comanda_id', comandaIds);

  const { data: orders } = await admin
    .from('orders')
    .select('*')
    .in('comanda_id', comandaIds)
    .order('created_at', { ascending: true });

  const orderList = orders ?? [];
  const orderIds = orderList.map((order) => order.id);

  const { data: items } = orderIds.length
    ? await admin
        .from('order_items')
        .select('*, menu_items(name)')
        .in('order_id', orderIds)
    : { data: [] };

  const peopleByComanda = new Map<string, typeof people>();
  for (const person of people ?? []) {
    const current = peopleByComanda.get(person.comanda_id) ?? [];
    current.push(person);
    peopleByComanda.set(person.comanda_id, current);
  }

  const itemsByOrder = new Map<string, unknown[]>();
  for (const item of items ?? []) {
    const menu = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
    const current = itemsByOrder.get(item.order_id) ?? [];
    current.push({ ...item, menu_item: menu });
    itemsByOrder.set(item.order_id, current);
  }

  const payload = list.map((comanda) => {
    const comandaPeople = peopleByComanda.get(comanda.id) ?? [];
    const comandaOrders = orderList
      .filter((order) => order.comanda_id === comanda.id)
      .map((order) => ({
        ...order,
        order_items: itemsByOrder.get(order.id) ?? [],
        comanda_person: { name: comandaPeople[0]?.name ?? 'Cliente' },
      }));

    return {
      ...comanda,
      comanda_people: comandaPeople,
      orders: comandaOrders,
    };
  });

  return NextResponse.json({ comandas: payload });
}
