import { BalcaoPanel } from '@/components/balcao/BalcaoPanel';
import { GerenciaHomeLink } from '@/components/ui/GerenciaHomeLink';
import { StaffShell } from '@/components/ui/StaffShell';

export const dynamic = 'force-dynamic';

export default function BalcaoPage() {
  return (
    <StaffShell
      title="Balcão"
      activePath="/balcao"
      actions={<GerenciaHomeLink />}
      navItems={[
        { href: '/balcao', label: 'Pedidos' },
        { href: '/balcao/cardapio', label: 'Cardápio' },
      ]}
    >
      <BalcaoPanel />
    </StaffShell>
  );
}
