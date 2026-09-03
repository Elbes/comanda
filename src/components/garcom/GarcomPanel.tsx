'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  openComandaByStaff,
  toggleMesaBlock,
} from '@/lib/actions/gerencia';
import { createPedido } from '@/lib/actions/pedidos';
import { closeAccount, calculateCloseAccount } from '@/lib/actions/fechamento';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils/currency';
import {
  LANCADO_POR_COLORS,
  LANCADO_POR_LABELS,
  MESA_STATUS_LABELS,
} from '@/lib/utils/constants';
import type {
  Table,
  MenuCategory,
  MenuItem,
  ComandaPerson,
  CartItem,
  DivisaoTipo,
  PagamentoForma,
} from '@/lib/types/database';

interface ComandaData {
  id: string;
  status: string;
  comanda_people: ComandaPerson[];
  orders: Array<{
    id: string;
    status: string;
    person_id: string;
    launched_by: string;
    order_items: Array<{
      quantity: number;
      unit_price: number;
      menu_item: { name: string };
    }>;
    comanda_person: { name: string };
  }>;
}

interface Props {
  tables: Table[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
}

function comandaTotal(comanda: ComandaData) {
  return (comanda.orders ?? [])
    .filter((order) => order.status !== 'cancelado')
    .reduce((sum, order) => {
      return (
        sum +
        (order.order_items ?? []).reduce(
          (s, item) => s + Number(item.quantity) * Number(item.unit_price),
          0
        )
      );
    }, 0);
}

function peopleOf(comanda: ComandaData | null): ComandaPerson[] {
  if (!comanda) return [];
  const raw = comanda.comanda_people as unknown;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return [raw as ComandaPerson];
  return [];
}

export function GarcomPanel({ tables, categories, menuItems }: Props) {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [comandas, setComandas] = useState<ComandaData[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedComandaId, setSelectedComandaId] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [divisionType, setDivisionType] = useState<DivisaoTipo>('por_pessoa');
  const [paymentMethod, setPaymentMethod] = useState<PagamentoForma>('pix');
  const [closePreview, setClosePreview] = useState<{
    subtotal: number;
    serviceFeeAmount: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id ?? '');

  const availableItems = useMemo(
    () => menuItems.filter((item) => item.available),
    [menuItems]
  );
  const menuCategories = useMemo(() => {
    const withItems = categories.filter((cat) =>
      availableItems.some((item) => item.category_id === cat.id)
    );
    return withItems.length ? withItems : categories;
  }, [categories, availableItems]);
  const activeCategory = menuCategories.some((cat) => cat.id === selectedCategory)
    ? selectedCategory
    : (menuCategories[0]?.id ?? '');
  const categoryItems = useMemo(
    () => availableItems.filter((item) => item.category_id === activeCategory),
    [availableItems, activeCategory]
  );

  const comanda = comandas.find((c) => c.id === selectedComandaId) ?? comandas[0] ?? null;
  const selectedPerson = peopleOf(comanda)[0];

  async function loadTable(num: number, preferComandaId?: string) {
    setError('');
    const table = tables.find((t) => t.number === num);
    if (!table) {
      setError('Mesa não encontrada.');
      return;
    }
    setSelectedTable(table);

    const res = await fetch(`/api/garcom/comanda?tableId=${table.id}`, { cache: 'no-store' });
    const data = await res.json();
    const list = (data.comandas ?? []) as ComandaData[];
    setComandas(list);
    const preferred =
      (preferComandaId && list.some((item) => item.id === preferComandaId) && preferComandaId) ||
      (selectedComandaId && list.some((item) => item.id === selectedComandaId) && selectedComandaId) ||
      list[0]?.id ||
      '';
    setSelectedComandaId(preferred);
  }

  function handleSearch() {
    const num = parseInt(tableNumber, 10);
    if (isNaN(num)) {
      setError('Informe um número válido.');
      return;
    }
    loadTable(num);
  }

  async function handleOpenComanda() {
    if (!selectedTable || !newPersonName.trim()) return;
    setLoading(true);
    const result = await openComandaByStaff(selectedTable.id, [newPersonName]);
    if (result.success) {
      setNewPersonName('');
      await loadTable(selectedTable.number, result.comandaId);
      setError('');
    } else {
      setError(result.error ?? 'Erro');
    }
    setLoading(false);
  }

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
        { menuItemId: item.id, name: item.name, price: Number(item.price), quantity: 1 },
      ];
    });
  }

  async function handleSubmitOrder() {
    if (!cart.length) return;
    if (!comanda || !selectedPerson) {
      setError('Selecione a comanda do cliente antes de lançar o pedido.');
      return;
    }
    setLoading(true);
    const result = await createPedido(cart, 'garcom', selectedPerson.id, comanda.id);
    if (!result.success) {
      setError(result.error ?? 'Não foi possível lançar o pedido.');
      setLoading(false);
      return;
    }
    setCart([]);
    setError('');
    await loadTable(selectedTable!.number, comanda.id);
    setLoading(false);
  }

  async function handleToggleBlock() {
    if (!selectedTable) return;
    setLoading(true);
    const block = selectedTable.status !== 'bloqueada';
    await toggleMesaBlock(selectedTable.id, block);
    router.refresh();
    setLoading(false);
  }

  async function handlePreviewClose() {
    if (!comanda) return;
    const preview = await calculateCloseAccount(comanda.id, divisionType);
    setClosePreview(preview);
    setShowCloseModal(true);
  }

  async function handleCloseAccount() {
    if (!comanda) return;
    setLoading(true);
    const result = await closeAccount({
      comandaId: comanda.id,
      divisionType,
      paymentMethod,
    });
    if (result.success) {
      setShowCloseModal(false);
      if (selectedTable) await loadTable(selectedTable.number);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex gap-2">
          <Input
            placeholder="Número da mesa"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            type="number"
          />
          <Button onClick={handleSearch}>Buscar</Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      {selectedTable && (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Mesa {selectedTable.number}</h2>
                <p className="text-sm text-gray-500">
                  {MESA_STATUS_LABELS[selectedTable.status]}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleToggleBlock}
                  loading={loading}
                >
                  {selectedTable.status === 'bloqueada' ? 'Liberar' : 'Bloquear'}
                </Button>
                {comanda && (
                  <Button size="sm" onClick={handlePreviewClose}>
                    Fechar conta
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {selectedTable.status !== 'bloqueada' && (
            <Card>
              <h3 className="font-semibold mb-3">
                {comandas.length ? 'Nova comanda nesta mesa' : 'Abrir comanda'}
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do cliente"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                />
                <Button onClick={handleOpenComanda} loading={loading}>
                  Abrir
                </Button>
              </div>
            </Card>
          )}

          {comanda && (
            <>
              <Card>
                <h3 className="font-semibold mb-2">Comandas da mesa</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {comandas.map((item) => {
                    const personName = peopleOf(item)[0]?.name ?? 'Cliente';
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedComandaId(item.id)}
                        className={`rounded-full px-3 py-1 text-sm ${
                          selectedComandaId === item.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        {personName} · {formatCurrency(comandaTotal(item))}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold mb-3">
                  Lançar pedido para {selectedPerson?.name ?? '—'}
                </h3>
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {menuCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
                        activeCategory === cat.id
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                  {categoryItems.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum item nesta categoria.</p>
                  ) : (
                    categoryItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span>
                          {item.name} — {formatCurrency(Number(item.price))}
                        </span>
                        <Button size="sm" onClick={() => addToCart(item)}>
                          +
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-sm mb-2">
                      Carrinho: {cart.map((c) => `${c.quantity}x ${c.name}`).join(', ')}
                    </p>
                    <Button className="w-full" onClick={handleSubmitOrder} loading={loading}>
                      Enviar pedido
                    </Button>
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="font-semibold mb-3">
                  Extrato de {selectedPerson?.name ?? 'cliente'} — {formatCurrency(comandaTotal(comanda))}
                </h3>
                {comanda.orders?.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem pedidos.</p>
                ) : (
                  <div className="space-y-2">
                    {comanda.orders?.map((order) => (
                      <div key={order.id} className="text-sm border-b pb-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="font-medium">{order.comanda_person?.name}</p>
                          <Badge
                            color={
                              LANCADO_POR_COLORS[order.launched_by] ?? LANCADO_POR_COLORS.cliente
                            }
                          >
                            {LANCADO_POR_LABELS[order.launched_by] ?? 'Cliente'}
                          </Badge>
                        </div>
                        {order.order_items?.map((item, idx) => (
                          <p key={idx} className="text-gray-600">
                            {item.quantity}x {item.menu_item?.name} —{' '}
                            {formatCurrency(item.quantity * Number(item.unit_price))}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      <Modal open={showCloseModal} onClose={() => setShowCloseModal(false)} title="Fechar conta">
        {closePreview && (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(closePreview.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de serviço</span>
                <span>{formatCurrency(closePreview.serviceFeeAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(closePreview.total)}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Divisão</label>
              <select
                className="w-full mt-1 rounded-lg border px-3 py-2"
                value={divisionType}
                onChange={(e) => setDivisionType(e.target.value as DivisaoTipo)}
              >
                <option value="por_pessoa">Conta individual</option>
                <option value="igual">Igual (se houver mais de uma pessoa nesta comanda)</option>
                <option value="livre">Livre</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Forma de pagamento</label>
              <select
                className="w-full mt-1 rounded-lg border px-3 py-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PagamentoForma)}
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="pix">PIX</option>
              </select>
            </div>

            <Button className="w-full" size="lg" onClick={handleCloseAccount} loading={loading}>
              Fechar conta desta pessoa
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
