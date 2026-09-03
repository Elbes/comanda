import Link from 'next/link';
import { logoutStaff } from '@/lib/actions/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { MenuAvailabilityPanel } from '@/components/balcao/MenuAvailabilityPanel';
import { Button } from '@/components/ui/Button';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-700">Balcão — Cardápio</h1>
        <form action={logoutStaff}>
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </header>

      <div className="p-4">
        <nav className="mb-6 flex gap-2">
          <Link
            href="/balcao"
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Pedidos
          </Link>
          <Link
            href="/balcao/cardapio"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white"
          >
            Cardápio
          </Link>
        </nav>

        <MenuAvailabilityPanel
          categories={categories ?? []}
          items={items ?? []}
        />
      </div>
    </div>
  );
}
