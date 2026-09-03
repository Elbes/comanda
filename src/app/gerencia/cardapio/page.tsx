import { GerenciaLayout, getGerenciaData } from '@/components/gerencia/GerenciaLayout';
import { CardapioManager } from '@/components/gerencia/CardapioManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function GerenciaCardapioPage() {
  const { categories, items } = await getGerenciaData();
  const admin = createAdminClient();
  const { data: usedRows } = await admin.from('order_items').select('menu_item_id');
  const usedItemIds = [...new Set((usedRows ?? []).map((row) => row.menu_item_id))];

  return (
    <GerenciaLayout activePath="/gerencia/cardapio">
      <CardapioManager categories={categories} items={items} usedItemIds={usedItemIds} />
    </GerenciaLayout>
  );
}
