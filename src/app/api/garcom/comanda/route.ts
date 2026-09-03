import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const tableId = request.nextUrl.searchParams.get('tableId');
  if (!tableId) {
    return NextResponse.json({ comanda: null });
  }

  const admin = createAdminClient();

  const { data: comanda } = await admin
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
    .single();

  return NextResponse.json({ comanda });
}
