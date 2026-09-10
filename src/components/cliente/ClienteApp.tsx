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
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

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
    <div className="client-shell flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-amber-800/10 bg-gradient-to-br from-amber-700 to-amber-800 px-4 py-4 text-white shadow-lg shadow-amber-900/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/80">
              Mesa {table.number}
            </p>
            <p className="text-lg font-semibold tracking-tight">Olá, {person.name}!</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur-sm">
            <p className="text-[11px] text-amber-100/80">Total parcial</p>
            <p className="font-bold tracking-tight">{formatCurrency(myTotal)}</p>
          </div>
        </div>
      </header>

      {message && (
        <div className="border-b border-green-200 bg-green-50 px-4 py-2.5 text-center text-sm font-medium text-green-700">
          {message}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 pb-28">
        {tab === 'cardapio' && (
          <div>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                      : 'bg-white text-stone-700 shadow-sm shadow-stone-900/5 ring-1 ring-stone-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="flex items-center gap-3 !p-3">
                  <MenuItemPhoto src={item.image_url} alt={item.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-tight text-stone-900">{item.name}</h3>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">
                        {item.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-base font-bold text-amber-700">
                      {formatCurrency(Number(item.price))}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-10 w-10 shrink-0 self-end !rounded-xl !px-0"
                    onClick={() => addToCart(item)}
                    aria-label={`Adicionar ${item.name}`}
                  >
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
              <p className="text-center text-stone-500">Carregando...</p>
            ) : orders.length === 0 ? (
              <Card className="text-center text-stone-500">Nenhum pedido ainda.</Card>
            ) : (
              orders.map((order) => {
                const total = orderTotal(order);
                return (
                  <Card key={order.id}>
                    <div className="mb-2 flex items-center justify-between">
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
                      <span className="text-xs text-stone-400">
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
                    <div className="mt-2 flex justify-between border-t border-stone-100 pt-2 text-sm font-semibold">
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
              <h3 className="mb-3 font-semibold text-stone-900">Sua comanda</h3>
              {orders.filter((o) => o.status !== 'cancelado').length === 0 ? (
                <p className="text-sm text-stone-500">Você ainda não fez pedidos.</p>
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

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="flex justify-between text-lg font-bold">
                <span>Seu total</span>
                <span className="text-amber-700">{formatCurrency(myTotal)}</span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
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
        <div className="fixed bottom-20 left-0 right-0 z-10 px-4">
          <Button className="w-full shadow-xl shadow-amber-900/20" size="lg" onClick={() => setShowCart(true)}>
            Ver carrinho ({cartCount}) — {formatCurrency(cartTotal)}
          </Button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-stone-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg">
          {([
            { id: 'cardapio' as Tab, label: 'Cardápio' },
            {
              id: 'pedidos' as Tab,
              label: orders.length ? `Pedidos (${orders.length})` : 'Pedidos',
            },
            { id: 'conta' as Tab, label: 'Minha conta' },
          ]).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === item.id
                  ? 'border-t-2 border-amber-600 text-amber-700'
                  : 'border-t-2 border-transparent text-stone-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <Modal open={showCart} onClose={() => setShowCart(false)} title="Seu pedido">
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.menuItemId} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-medium text-stone-800">{item.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateCartQuantity(item.menuItemId, -1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-lg font-semibold text-stone-700"
                >
                  -
                </button>
                <span className="w-6 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateCartQuantity(item.menuItemId, 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-lg font-semibold text-stone-700"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          <textarea
            className="w-full rounded-2xl border border-stone-200 p-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15"
            placeholder="Observação (opcional)"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={2}
          />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-amber-700">{formatCurrency(cartTotal)}</span>
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmitOrder} loading={loading}>
            Enviar pedido
          </Button>
        </div>
      </Modal>
    </div>
  );
}
