import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency } from '@/lib/utils/currency';

export async function RelatoriosPanel() {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: payments } = await admin
    .from('payments')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  const { data: cancelledOrders } = await admin
    .from('orders')
    .select('id, cancel_reason, created_at')
    .eq('status', 'cancelado')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.total), 0) ?? 0;
  const avgTicket = payments?.length ? totalRevenue / payments.length : 0;
  const cancelledCount = cancelledOrders?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento (30d)" value={formatCurrency(totalRevenue)} />
        <StatCard title="Ticket médio" value={formatCurrency(avgTicket)} />
        <StatCard title="Contas fechadas" value={String(payments?.length ?? 0)} />
        <StatCard title="Pedidos cancelados" value={String(cancelledCount)} />
      </div>

      {cancelledOrders && cancelledOrders.length > 0 && (
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
