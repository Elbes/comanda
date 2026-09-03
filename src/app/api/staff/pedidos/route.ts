import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCounterAccess } from '@/lib/auth/staff';

export async function GET() {
  const { staff, error } = await requireCounterAccess();

  if (!staff) {
    return NextResponse.json({ error }, { status: error === 'Sem permissão.' ? 403 : 401 });
  }

  const admin = createAdminClient();

  const { data: orders, error: dbError } = await admin
    .from('orders')
    .select(`
      *,
      order_items(*, menu_item:menu_items(name)),
      comanda_person:comanda_people(name),
      comanda:comandas(table_id, tables(number))
    `)
    .in('status', ['pendente', 'em_preparo'])
    .order('created_at', { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: 'Erro ao buscar pedidos.' }, { status: 500 });
  }

  return NextResponse.json({ orders: orders ?? [] });
}
