import { GerenciaLayout, getGerenciaData } from '@/components/gerencia/GerenciaLayout';
import { CardapioManager } from '@/components/gerencia/CardapioManager';

export const dynamic = 'force-dynamic';

export default async function GerenciaCardapioPage() {
  const { categories, items } = await getGerenciaData();

  return (
    <GerenciaLayout activePath="/gerencia/cardapio">
      <CardapioManager categories={categories} items={items} />
    </GerenciaLayout>
  );
}
