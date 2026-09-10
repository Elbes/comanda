import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { StaffShell } from '@/components/ui/StaffShell';

const NAV_ITEMS = [
  { href: '/gerencia', label: 'Mesas' },
  { href: '/gerencia/balcao', label: 'Pedidos' },
  { href: '/gerencia/cardapio', label: 'Cardápio' },
  { href: '/gerencia/usuarios', label: 'Usuários' },
  { href: '/gerencia/config', label: 'Configurações' },
  { href: '/gerencia/relatorios', label: 'Relatórios' },
];

export function GerenciaLayout({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath: string;
}) {
  return (
    <StaffShell
      title="Gerência"
      navItems={NAV_ITEMS}
      activePath={activePath}
      actions={
        <>
          <Link
            href="/garcom"
            className="hidden rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200 sm:inline-flex"
          >
            Área Garçom
          </Link>
          <Link
            href="/balcao"
            className="hidden rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200 sm:inline-flex"
          >
            Área Balcão
          </Link>
        </>
      }
    >
      {children}
    </StaffShell>
  );
}

export async function getGerenciaData() {
  const admin = createAdminClient();
  const [tables, categories, items, config, users] = await Promise.all([
    admin.from('tables').select('*').order('number'),
    admin.from('menu_categories').select('*').order('display_order'),
    admin.from('menu_items').select('*').order('display_order'),
    admin.from('establishment_config').select('*').limit(1).single(),
    admin.from('system_users').select('*').order('name'),
  ]);

  return {
    tables: tables.data ?? [],
    categories: categories.data ?? [],
    items: items.data ?? [],
    config: config.data,
    users: users.data ?? [],
  };
}
