import { getTableByToken, getClientSession } from '@/lib/actions/comanda';
import { createAdminClient } from '@/lib/supabase/admin';
import { ClienteApp } from '@/components/cliente/ClienteApp';
import { JoinForm } from '@/components/cliente/JoinForm';
import { BlockedMessage } from '@/components/cliente/BlockedMessage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function MesaPage({ params }: PageProps) {
  const { token } = await params;
  const table = await getTableByToken(token);

  if (!table) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-gray-600">Mesa não encontrada.</p>
      </main>
    );
  }

  if (table.status === 'bloqueada') {
    return <BlockedMessage reason="bloqueada" tableNumber={table.number} />;
  }

  const session = await getClientSession();

  if (session.person && session.comanda && session.table?.token === token) {
    const admin = createAdminClient();

    const { data: categories } = await admin
      .from('menu_categories')
      .select('*')
      .eq('active', true)
      .order('display_order');

    const { data: items } = await admin
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('display_order');

    const activeCategoryIds = new Set((categories ?? []).map((category) => category.id));
    const visibleItems = (items ?? []).filter((item) => activeCategoryIds.has(item.category_id));

    return (
      <ClienteApp
        table={session.table}
        comanda={session.comanda}
        person={session.person}
        categories={categories ?? []}
        menuItems={visibleItems}
      />
    );
  }

  return <JoinForm table={table} />;
}
