import { GerenciaLayout } from '@/components/gerencia/GerenciaLayout';
import { RelatoriosPanel } from '@/components/gerencia/RelatoriosPanel';

export const dynamic = 'force-dynamic';

export default function GerenciaRelatoriosPage() {
  return (
    <GerenciaLayout activePath="/gerencia/relatorios">
      <RelatoriosPanel />
    </GerenciaLayout>
  );
}
