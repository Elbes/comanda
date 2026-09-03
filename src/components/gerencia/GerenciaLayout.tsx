import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { logoutStaff } from '@/lib/actions/auth';
import { Button } from '@/components/ui/Button';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-amber-700 shrink-0">Gerência</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/garcom"
            className="hidden sm:inline-flex rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Área Garçom
          </Link>
          <Link
            href="/balcao"
            className="hidden sm:inline-flex rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Área Balcão
          </Link>
          <form action={logoutStaff}>
            <Button type="submit" variant="ghost" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>

      <nav className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${
              activePath === item.href
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4">{children}</div>
    </div>
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
