'use client';

import { useState, useMemo } from 'react';
import { createPedido } from '@/lib/actions/pedidos';
import { requestPayment } from '@/lib/actions/comanda';
import { useMyOrders } from '@/hooks/useRealtimeOrders';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MenuItemPhoto } from '@/components/menu/MenuItemPhoto';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils/currency';
import {
  LANCADO_POR_COLORS,
  LANCADO_POR_LABELS,
  PEDIDO_STATUS_LABELS,
  PEDIDO_STATUS_COLORS,
} from '@/lib/utils/constants';
import type {
  Table,
  Comanda,
  ComandaPerson,
  MenuCategory,
  MenuItem,
  CartItem,
} from '@/lib/types/database';

interface Props {
  table: Table;
  comanda: Comanda;
  person: ComandaPerson;
  categories: MenuCategory[];
  menuItems: MenuItem[];
}

type Tab = 'cardapio' | 'pedidos' | 'conta';

export function ClienteApp({
  table,
  comanda,
  person,
  categories,
  menuItems,
}: Props) {
  const [tab, setTab] = useState<Tab>('cardapio');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id ?? '');
  const [showCart, setShowCart] = useState(false);
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { orders, loading: ordersLoading, refresh } = useMyOrders(true);

  const filteredItems = useMemo(
    () => menuItems.filter((i) => i.category_id === selectedCategory),
    [menuItems, selectedCategory]
  );

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  function orderTotal(order: (typeof orders)[number]) {
    return (
      order.order_items?.reduce(
        (s, item) => s + Number(item.unit_price) * Number(item.quantity),
        0
      ) ?? 0
    );
  }

  const myTotal = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelado')
      .reduce((sum, order) => sum + orderTotal(order), 0);
  }, [orders]);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
        },
      ];
    });
  }

  function updateCartQuantity(menuItemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItemId === menuItemId
            ? { ...c, quantity: c.quantity + delta }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  }

  async function handleSubmitOrder() {
    if (!cart.length) return;
    setLoading(true);
    const items = cart.map((c) => ({
      ...c,
      observation: observation || undefined,
    }));
    const result = await createPedido(items);
    if (result.success) {
      setCart([]);
      setObservation('');
      setShowCart(false);
      setTab('pedidos');
      setMessage('Pedido enviado!');
      await refresh();
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(result.error ?? 'Erro ao enviar pedido.');
    }
    setLoading(false);
  }

  async function handleRequestPayment() {
    setLoading(true);
    const result = await requestPayment();
    if (result.success) {
      setMessage('Conta solicitada! Aguarde o garçom.');
    } else {
      setMessage(result.error ?? 'Erro ao solicitar conta.');
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 bg-amber-700 px-4 py-3 text-white shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Mesa {table.number}</p>
            <p className="font-semibold">Olá, {person.name}!</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">Total parcial</p>
            <p className="font-bold">{formatCurrency(myTotal)}</p>
          </div>
        </div>
      </header>

      {message && (
        <div className="bg-green-50 px-4 py-2 text-center text-sm text-green-700">
          {message}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {tab === 'cardapio' && (
          <div>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="flex items-center gap-3 !p-3">
                  <MenuItemPhoto src={item.image_url} alt={item.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium leading-tight">{item.name}</h3>
                    {item.description && (
                      <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    )}
                    <p className="mt-1 font-semibold text-amber-700">
                      {formatCurrency(Number(item.price))}
                    </p>
                  </div>
                  <Button size="sm" className="self-end" onClick={() => addToCart(item)}>
                    +
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === 'pedidos' && (
          <div className="space-y-3">
            {ordersLoading ? (
              <p className="text-center text-gray-500">Carregando...</p>
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-500">Nenhum pedido ainda.</p>
            ) : (
              orders.map((order) => {
                const total = orderTotal(order);
                return (
                  <Card key={order.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge color={PEDIDO_STATUS_COLORS[order.status]}>
                          {PEDIDO_STATUS_LABELS[order.status]}
                        </Badge>
                        {order.launched_by === 'garcom' && (
                          <Badge color={LANCADO_POR_COLORS.garcom}>
                            {LANCADO_POR_LABELS.garcom}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {order.order_items?.map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span>
                            {item.quantity}x {item.menu_item?.name ?? 'Item'}
                          </span>
                          <span className="shrink-0 font-medium">
                            {formatCurrency(Number(item.unit_price) * Number(item.quantity))}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
                      <span>Total do pedido</span>
                      <span className="text-amber-700">{formatCurrency(total)}</span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {tab === 'conta' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold mb-3">Sua comanda</h3>
              {orders.filter((o) => o.status !== 'cancelado').length === 0 ? (
                <p className="text-sm text-gray-500">Você ainda não fez pedidos.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {orders
                    .filter((o) => o.status !== 'cancelado')
                    .flatMap((order) =>
                      (order.order_items ?? []).map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span>
                            {item.quantity}x {item.menu_item?.name ?? 'Item'}
                            {order.launched_by === 'garcom' && (
                              <span className="ml-1 text-xs font-medium text-amber-700">
                                · {LANCADO_POR_LABELS.garcom}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0">
                            {formatCurrency(Number(item.unit_price) * Number(item.quantity))}
                          </span>
                        </li>
                      ))
                    )}
                </ul>
              )}
            </Card>

            <Card>
              <div className="flex justify-between text-lg font-bold">
                <span>Seu total</span>
                <span className="text-amber-700">{formatCurrency(myTotal)}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Apenas os seus pedidos. A taxa de serviço é aplicada no fechamento.
              </p>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handleRequestPayment}
              loading={loading}
            >
              Solicitar conta
            </Button>
          </div>
        )}
      </main>

      {cart.length > 0 && tab === 'cardapio' && (
        <div className="fixed bottom-16 left-0 right-0 px-4">
          <Button className="w-full shadow-lg" size="lg" onClick={() => setShowCart(true)}>
            Ver carrinho ({cart.length}) — {formatCurrency(cartTotal)}
          </Button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 flex border-t bg-white">
        {(['cardapio', 'pedidos', 'conta'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize ${
              tab === t ? 'text-amber-700 border-t-2 border-amber-700' : 'text-gray-500'
            }`}
          >
            {t === 'cardapio' ? 'Cardápio' : t === 'pedidos' ? `Pedidos${orders.length ? ` (${orders.length})` : ''}` : 'Minha conta'}
          </button>
        ))}
      </nav>

      <Modal open={showCart} onClose={() => setShowCart(false)} title="Seu pedido">
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.menuItemId} className="flex items-center justify-between">
              <span className="text-sm">{item.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateCartQuantity(item.menuItemId, -1)}
                  className="h-8 w-8 rounded-full bg-gray-100 text-lg"
                >
                  -
                </button>
                <span className="w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateCartQuantity(item.menuItemId, 1)}
                  className="h-8 w-8 rounded-full bg-gray-100 text-lg"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          <textarea
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            placeholder="Observação (opcional)"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={2}
          />

          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmitOrder} loading={loading}>
            Enviar pedido
          </Button>
        </div>
      </Modal>
    </div>
  );
}
