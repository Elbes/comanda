import { GerenciaLayout } from '@/components/gerencia/GerenciaLayout';
import { BalcaoPanel } from '@/components/balcao/BalcaoPanel';

export const dynamic = 'force-dynamic';

export default function GerenciaBalcaoPage() {
  return (
    <GerenciaLayout activePath="/gerencia/balcao">
      <div>
        <h2 className="text-lg font-semibold mb-1">Painel de pedidos</h2>
        <p className="text-sm text-gray-500 mb-4">
          Acompanhe e atualize os pedidos em tempo real.
        </p>
        <BalcaoPanel />
      </div>
    </GerenciaLayout>
  );
}
