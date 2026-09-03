import { GerenciaLayout, getGerenciaData } from '@/components/gerencia/GerenciaLayout';
import { MesasManager } from '@/components/gerencia/MesasManager';

export const dynamic = 'force-dynamic';

export default async function GerenciaPage() {
  const { tables } = await getGerenciaData();

  return (
    <GerenciaLayout activePath="/gerencia">
      <MesasManager tables={tables} />
    </GerenciaLayout>
  );
}
