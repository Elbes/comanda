'use client';

import { useState } from 'react';
import { advancePedidoStatus, cancelPedido } from '@/lib/actions/pedidos';
import { useRealtimeCounterOrders } from '@/hooks/useRealtimeOrders';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils/currency';
import { PEDIDO_STATUS_LABELS, PEDIDO_STATUS_COLORS } from '@/lib/utils/constants';

interface OrderWithTable {
  id: string;
  status: string;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    observation: string | null;
    menu_item?: { name: string };
  }>;
  comanda_person?: { name: string };
  comanda?: { table_id: string; tables: { number: number } };
}

export function BalcaoPanel() {
  const { orders, loading, newOrderAlert, dismissAlert, authError, refresh, applyOrderStatus } =
    useRealtimeCounterOrders();
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const ordersByTable = (orders as OrderWithTable[]).reduce(
    (acc, order) => {
      const tableNum = order.comanda?.tables?.number ?? 0;
      if (!acc[tableNum]) acc[tableNum] = [];
      acc[tableNum].push(order);
      return acc;
    },
    {} as Record<number, OrderWithTable[]>
  );

  async function handleAdvance(orderId: string, currentStatus: string) {
    const nextStatus: Record<string, string> = {
      pendente: 'em_preparo',
      em_preparo: 'pronto',
      pronto: 'entregue',
    };
    const status = nextStatus[currentStatus];
    if (!status) return;

    setBusyOrderId(orderId);
    applyOrderStatus(orderId, status);
    const result = await advancePedidoStatus(orderId, currentStatus);
    if (!result.success) {
      await refresh();
    }
    setBusyOrderId(null);
  }

  async function handleCancel() {
    if (!cancelModal || !cancelReason.trim()) return;
    setBusyOrderId(cancelModal);
    applyOrderStatus(cancelModal, 'cancelado');
    await cancelPedido(cancelModal, cancelReason);
    setCancelModal(null);
    setCancelReason('');
    setBusyOrderId(null);
    await refresh();
  }

  const nextAction: Record<string, string> = {
    pendente: 'Iniciar preparo',
    em_preparo: 'Marcar pronto',
    pronto: 'Entregar',
  };

  return (
    <div>
      {authError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {authError}
        </div>
      )}

      {newOrderAlert && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-100 px-4 py-3 animate-pulse">
          <span className="font-semibold text-amber-800">🔔 Novo pedido!</span>
          <Button size="sm" variant="secondary" onClick={dismissAlert}>
            OK
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Carregando pedidos...</p>
      ) : Object.keys(ordersByTable).length === 0 ? (
        <p className="text-center text-gray-500 py-12">Nenhum pedido pendente.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(ordersByTable)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([tableNum, tableOrders]) => (
              <Card key={tableNum}>
                <h3 className="text-lg font-bold text-amber-700 mb-3">
                  Mesa {tableNum}
                </h3>
                <div className="space-y-3">
                  {tableOrders.map((order) => (
                    <div key={order.id} className="border-t pt-3 first:border-0 first:pt-0">
                      <div className="flex items-center justify-between mb-1">
                        <Badge color={PEDIDO_STATUS_COLORS[order.status]}>
                          {PEDIDO_STATUS_LABELS[order.status]}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {order.comanda_person?.name} •{' '}
                          {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <ul className="text-sm space-y-0.5 mb-2">
                        {order.order_items?.map((item) => (
                          <li key={item.id}>
                            {item.quantity}x {item.menu_item?.name}
                            {item.observation && (
                              <span className="text-gray-400"> ({item.observation})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2">
                        {nextAction[order.status] && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvance(order.id, order.status)}
                            loading={busyOrderId === order.id}
                          >
                            {nextAction[order.status]}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setCancelModal(order.id)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
        </div>
      )}

      <Modal
        open={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Cancelar pedido"
      >
        <div className="space-y-4">
          <Input
            label="Motivo do cancelamento"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />
          <Button
            variant="danger"
            className="w-full"
            onClick={handleCancel}
            loading={busyOrderId === cancelModal}
          >
            Confirmar cancelamento
          </Button>
        </div>
      </Modal>
    </div>
  );
}
