'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  deleteMenuCategory,
} from '@/lib/actions/gerencia';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils/currency';
import type { MenuCategory, MenuItem } from '@/lib/types/database';

interface Props {
  categories: MenuCategory[];
  items: MenuItem[];
}

export function CardapioManager({ categories, items }: Props) {
  const router = useRouter();
  const [showCategory, setShowCategory] = useState(false);
  const [showItem, setShowItem] = useState(false);
  const [catName, setCatName] = useState('');
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: categories[0]?.id ?? '',
  });
  const [loading, setLoading] = useState(false);

  async function handleCreateCategory() {
    setLoading(true);
    await createMenuCategory(catName, categories.length + 1);
    setShowCategory(false);
    setCatName('');
    router.refresh();
    setLoading(false);
  }

  async function handleCreateItem() {
    setLoading(true);
    await createMenuItem({
      category_id: itemForm.category_id,
      name: itemForm.name,
      description: itemForm.description || undefined,
      price: parseFloat(itemForm.price),
    });
    setShowItem(false);
    setItemForm({ name: '', description: '', price: '', category_id: categories[0]?.id ?? '' });
    router.refresh();
    setLoading(false);
  }

  async function handleToggleAvailable(item: MenuItem) {
    await updateMenuItem(item.id, { available: !item.available });
    router.refresh();
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Remover este item?')) return;
    await deleteMenuItem(id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" onClick={() => setShowCategory(true)}>Nova categoria</Button>
        <Button size="sm" variant="secondary" onClick={() => setShowItem(true)}>Novo item</Button>
      </div>

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category_id === cat.id);
        return (
          <div key={cat.id} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{cat.name}</h3>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  if (confirm('Remover categoria e todos os itens?')) {
                    await deleteMenuCategory(cat.id);
                    router.refresh();
                  }
                }}
              >
                Remover
              </Button>
            </div>
            <div className="space-y-2">
              {catItems.map((item) => (
                <Card key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(Number(item.price))} •{' '}
                      {item.available ? 'Disponível' : 'Indisponível'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleToggleAvailable(item)}>
                      {item.available ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteItem(item.id)}>
                      ✕
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      <Modal open={showCategory} onClose={() => setShowCategory(false)} title="Nova categoria">
        <div className="space-y-4">
          <Input label="Nome" value={catName} onChange={(e) => setCatName(e.target.value)} />
          <Button className="w-full" onClick={handleCreateCategory} loading={loading}>Criar</Button>
        </div>
      </Modal>

      <Modal open={showItem} onClose={() => setShowItem(false)} title="Novo item">
        <div className="space-y-4">
          <Input label="Nome" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
          <Input label="Descrição" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
          <Input label="Preço" type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <select
              className="w-full mt-1 rounded-lg border px-3 py-2"
              value={itemForm.category_id}
              onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Button className="w-full" onClick={handleCreateItem} loading={loading}>Criar</Button>
        </div>
      </Modal>
    </div>
  );
}
