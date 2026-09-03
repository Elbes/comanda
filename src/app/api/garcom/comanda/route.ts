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
    .select(`
      *,
      comanda_people(*),
      orders(
        *,
        order_items(*, menu_item:menu_items(name)),
        comanda_person:comanda_people(name)
      )
    `)
    .eq('table_id', tableId)
    .eq('status', 'aberta')
    .order('opened_at', { ascending: true });

  return NextResponse.json({ comandas: comandas ?? [] });
}
