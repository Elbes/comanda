import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency } from '@/lib/utils/currency';

export async function RelatoriosPanel() {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  const { data: payments } = await admin
    .from('payments')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  const { data: orders } = await admin
    .from('orders')
    .select('id, status, cancel_reason, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  const orderList = orders ?? [];
  const validOrders = orderList.filter((o) => o.status !== 'cancelado');
  const cancelledOrders = orderList.filter((o) => o.status === 'cancelado');
  const validIds = validOrders.map((o) => o.id);

  const { data: items } = validIds.length
    ? await admin
        .from('order_items')
        .select('order_id, quantity, unit_price, menu_item_id, menu_items(name)')
        .in('order_id', validIds)
    : { data: [] as Array<{
        order_id: string;
        quantity: number;
        unit_price: number;
        menu_items: { name: string } | { name: string }[] | null;
      }> };

  const itemRows = items ?? [];

  const salesByOrder = new Map<string, number>();
  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

  for (const item of itemRows) {
    const value = Number(item.quantity) * Number(item.unit_price);
    salesByOrder.set(item.order_id, (salesByOrder.get(item.order_id) ?? 0) + value);
    const menu = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
    const name = menu?.name ?? 'Item';
    const current = itemMap.get(name) ?? { name, quantity: 0, revenue: 0 };
    current.quantity += Number(item.quantity);
    current.revenue += value;
    itemMap.set(name, current);
  }

  const salesTotal = [...salesByOrder.values()].reduce((sum, value) => sum + value, 0);
  const closedRevenue = payments?.reduce((sum, p) => sum + Number(p.total), 0) ?? 0;
  const avgTicket = validOrders.length ? salesTotal / validOrders.length : 0;
  const topItems = [...itemMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Vendas em pedidos (30d)" value={formatCurrency(salesTotal)} />
        <StatCard title="Contas fechadas (30d)" value={formatCurrency(closedRevenue)} />
        <StatCard title="Ticket médio (pedido)" value={formatCurrency(avgTicket)} />
        <StatCard title="Pedidos / cancelados" value={`${validOrders.length} / ${cancelledOrders.length}`} />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold mb-3">Itens mais vendidos</h3>
        {topItems.length === 0 ? (
          <p className="text-sm text-gray-500">Ainda não há vendas no período.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {topItems.map((item) => (
              <li key={item.name} className="flex items-center justify-between border-b pb-2 last:border-0">
                <span>
                  {item.name}{' '}
                  <span className="text-gray-400">({item.quantity} un.)</span>
                </span>
                <span className="font-medium">{formatCurrency(item.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cancelledOrders.length > 0 && (
        <div className="rounded-xl border bg-white p-4">
          <h3 className="font-semibold mb-3">Cancelamentos recentes</h3>
          <ul className="space-y-2 text-sm">
            {cancelledOrders.slice(0, 10).map((o) => (
              <li key={o.id} className="flex justify-between border-b pb-2">
                <span>{o.cancel_reason ?? 'Sem motivo'}</span>
                <span className="text-gray-400">
                  {new Date(o.created_at).toLocaleDateString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-amber-700 mt-1">{value}</p>
    </div>
  );
}
