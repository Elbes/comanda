import { GerenciaLayout, getGerenciaData } from '@/components/gerencia/GerenciaLayout';
import { ConfigManager } from '@/components/gerencia/ConfigManager';

export const dynamic = 'force-dynamic';

export default async function GerenciaConfigPage() {
  const { config } = await getGerenciaData();

  return (
    <GerenciaLayout activePath="/gerencia/config">
      <ConfigManager config={config} />
    </GerenciaLayout>
  );
}
