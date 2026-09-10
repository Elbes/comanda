import { createAdminClient } from '@/lib/supabase/admin';
import { MenuAvailabilityPanel } from '@/components/balcao/MenuAvailabilityPanel';
import { GerenciaHomeLink } from '@/components/ui/GerenciaHomeLink';
import { StaffShell } from '@/components/ui/StaffShell';

export const dynamic = 'force-dynamic';

export default async function BalcaoCardapioPage() {
  const admin = createAdminClient();

  const { data: categories } = await admin
    .from('menu_categories')
    .select('*')
    .order('display_order');

  const { data: items } = await admin
    .from('menu_items')
    .select('*')
    .order('display_order');

  return (
    <StaffShell
      title="Balcão — Cardápio"
      activePath="/balcao/cardapio"
      actions={<GerenciaHomeLink />}
      navItems={[
        { href: '/balcao', label: 'Pedidos' },
        { href: '/balcao/cardapio', label: 'Cardápio' },
      ]}
    >
      <MenuAvailabilityPanel categories={categories ?? []} items={items ?? []} />
    </StaffShell>
  );
}
