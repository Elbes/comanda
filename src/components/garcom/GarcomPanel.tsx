'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  openComandaByStaff,
  addPersonToComanda,
  toggleMesaBlock,
} from '@/lib/actions/gerencia';
import { createPedido } from '@/lib/actions/pedidos';
import { closeAccount, calculateCloseAccount } from '@/lib/actions/fechamento';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils/currency';
import { MESA_STATUS_LABELS } from '@/lib/utils/constants';
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

export function GarcomPanel({ tables, categories, menuItems }: Props) {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [comanda, setComanda] = useState<ComandaData | null>(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [divisionType, setDivisionType] = useState<DivisaoTipo>('igual');
  const [paymentMethod, setPaymentMethod] = useState<PagamentoForma>('pix');
  const [closePreview, setClosePreview] = useState<{
    subtotal: number;
    serviceFeeAmount: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadTable(num: number) {
    setError('');
    const table = tables.find((t) => t.number === num);
    if (!table) {
      setError('Mesa não encontrada.');
      return;
    }
    setSelectedTable(table);

    const res = await fetch(`/api/garcom/comanda?tableId=${table.id}`);
    const data = await res.json();
    setComanda(data.comanda);
    if (data.comanda?.comanda_people?.length) {
      setSelectedPerson(data.comanda.comanda_people[0].id);
    }
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
      await loadTable(selectedTable.number);
    } else {
      setError(result.error ?? 'Erro');
    }
    setLoading(false);
  }

  async function handleAddPerson() {
    if (!comanda || !newPersonName.trim()) return;
    setLoading(true);
    await addPersonToComanda(comanda.id, newPersonName);
    setNewPersonName('');
    if (selectedTable) await loadTable(selectedTable.number);
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
    if (!cart.length || !selectedPerson || !comanda) return;
    setLoading(true);
    await createPedido(cart, 'garcom', selectedPerson, comanda.id);
    setCart([]);
    if (selectedTable) await loadTable(selectedTable.number);
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
      setComanda(null);
      setSelectedTable(null);
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

          {!comanda && selectedTable.status !== 'bloqueada' && (
            <Card>
              <h3 className="font-semibold mb-3">Abrir comanda</h3>
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
                <h3 className="font-semibold mb-2">Pessoas</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {comanda.comanda_people.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPerson(p.id)}
                      className={`rounded-full px-3 py-1 text-sm ${
                        selectedPerson === p.id
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar pessoa"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                  />
                  <Button size="sm" onClick={handleAddPerson} loading={loading}>
                    +
                  </Button>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold mb-3">Lançar pedido</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                  {menuItems
                    .filter((i) => i.available)
                    .map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span>{item.name} — {formatCurrency(Number(item.price))}</span>
                        <Button size="sm" onClick={() => addToCart(item)}>+</Button>
                      </div>
                    ))}
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
                <h3 className="font-semibold mb-3">Extrato</h3>
                {comanda.orders?.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem pedidos.</p>
                ) : (
                  <div className="space-y-2">
                    {comanda.orders?.map((order) => (
                      <div key={order.id} className="text-sm border-b pb-2">
                        <p className="font-medium">{order.comanda_person?.name}</p>
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
                <option value="igual">Igual entre todos</option>
                <option value="por_pessoa">Por pessoa</option>
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
              Confirmar fechamento
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
