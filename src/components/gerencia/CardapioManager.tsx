'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createMenuCategory,
  updateMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  deleteMenuCategory,
  uploadMenuItemImage,
} from '@/lib/actions/gerencia';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { MenuItemPhoto } from '@/components/menu/MenuItemPhoto';
import { formatCurrency } from '@/lib/utils/currency';
import type { MenuCategory, MenuItem } from '@/lib/types/database';

interface Props {
  categories: MenuCategory[];
  items: MenuItem[];
  usedItemIds: string[];
}

const emptyItemForm = (categoryId: string) => ({
  name: '',
  description: '',
  price: '',
  category_id: categoryId,
});

export function CardapioManager({ categories, items, usedItemIds }: Props) {
  const router = useRouter();
  const usedItems = new Set(usedItemIds);
  const usedCategories = new Set(
    items.filter((item) => usedItems.has(item.id)).map((item) => item.category_id)
  );

  const [showCategory, setShowCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [showItem, setShowItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [catName, setCatName] = useState('');
  const [itemForm, setItemForm] = useState(emptyItemForm(categories[0]?.id ?? ''));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function categoryUsed(id: string) {
    return usedCategories.has(id);
  }

  function itemUsed(id: string) {
    return usedItems.has(id);
  }

  function resetItemForm() {
    setEditingItem(null);
    setItemForm(emptyItemForm(categories[0]?.id ?? ''));
    setImageFile(null);
    setImagePreview('');
  }

  function openNewItem() {
    resetItemForm();
    setShowItem(true);
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      category_id: item.category_id,
    });
    setImageFile(null);
    setImagePreview(item.image_url ?? '');
    setShowItem(true);
  }

  function openNewCategory() {
    setEditingCategory(null);
    setCatName('');
    setShowCategory(true);
  }

  function openEditCategory(cat: MenuCategory) {
    setEditingCategory(cat);
    setCatName(cat.name);
    setShowCategory(true);
  }

  function onPickImage(file: File | undefined) {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return uploadMenuItemImage(formData);
  }

  async function handleSaveCategory() {
    if (!catName.trim()) return;
    setError('');
    setLoading(true);
    const result = editingCategory
      ? await updateMenuCategory(editingCategory.id, { name: catName.trim() })
      : await createMenuCategory(catName.trim(), categories.length + 1);
    if (!result.success) {
      setError(result.error ?? 'Erro ao salvar categoria.');
      setLoading(false);
      return;
    }
    setShowCategory(false);
    setEditingCategory(null);
    setCatName('');
    router.refresh();
    setLoading(false);
  }

  async function handleToggleCategory(cat: MenuCategory) {
    setError('');
    const result = await updateMenuCategory(cat.id, { active: !cat.active });
    if (!result.success) setError(result.error ?? 'Erro ao atualizar categoria.');
    router.refresh();
  }

  async function handleSaveItem() {
    setError('');
    const price = parseFloat(itemForm.price);
    if (!itemForm.name.trim() || Number.isNaN(price) || price < 0) {
      setError('Informe nome e um preço válido.');
      return;
    }

    setLoading(true);
    let imageUrl: string | undefined;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (!uploaded.success) {
        setError(uploaded.error ?? 'Erro ao enviar a imagem.');
        setLoading(false);
        return;
      }
      imageUrl = uploaded.url;
    }

    const payload = {
      category_id: itemForm.category_id,
      name: itemForm.name.trim(),
      description: itemForm.description.trim(),
      price,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    };

    const result = editingItem
      ? await updateMenuItem(editingItem.id, payload)
      : await createMenuItem(payload);

    if (!result.success) {
      setError(result.error ?? 'Erro ao salvar item.');
      setLoading(false);
      return;
    }
    setShowItem(false);
    resetItemForm();
    router.refresh();
    setLoading(false);
  }

  async function handleToggleItem(item: MenuItem) {
    setError('');
    const result = await updateMenuItem(item.id, { available: !item.available });
    if (!result.success) setError(result.error ?? 'Erro ao atualizar item.');
    router.refresh();
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Remover este item?')) return;
    setError('');
    const result = await deleteMenuItem(id);
    if (!result.success) setError(result.error ?? 'Erro ao remover item.');
    router.refresh();
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Remover categoria e todos os itens?')) return;
    setError('');
    const result = await deleteMenuCategory(id);
    if (!result.success) setError(result.error ?? 'Erro ao remover categoria.');
    router.refresh();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" onClick={openNewCategory}>Nova categoria</Button>
        <Button size="sm" variant="secondary" onClick={openNewItem}>Novo item</Button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <p className="mb-4 text-xs text-gray-500">
        Produtos e categorias já pedidos só podem ser ativados ou desativados.
      </p>

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category_id === cat.id);
        const used = categoryUsed(cat.id);
        return (
          <div key={cat.id} className="mb-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">
                  {cat.name}
                  {!cat.active && (
                    <span className="ml-2 text-sm font-normal text-gray-400">(inativa)</span>
                  )}
                </h3>
                {used && (
                  <p className="text-xs text-gray-400">Já usada em pedidos</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!used && (
                  <Button size="sm" variant="secondary" onClick={() => openEditCategory(cat)}>
                    Editar
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => handleToggleCategory(cat)}>
                  {cat.active ? 'Desativar' : 'Ativar'}
                </Button>
                {!used && (
                  <Button size="sm" variant="danger" onClick={() => handleDeleteCategory(cat.id)}>
                    Remover
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {catItems.map((item) => {
                const sold = itemUsed(item.id);
                return (
                  <Card key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <MenuItemPhoto src={item.image_url} alt={item.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(Number(item.price))} •{' '}
                          {item.available ? 'Ativo' : 'Inativo'}
                          {sold ? ' • já pedido' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      {!sold && (
                        <Button size="sm" variant="secondary" onClick={() => openEditItem(item)}>
                          Editar
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => handleToggleItem(item)}>
                        {item.available ? 'Desativar' : 'Ativar'}
                      </Button>
                      {!sold && (
                        <Button size="sm" variant="danger" onClick={() => handleDeleteItem(item.id)}>
                          ✕
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <Modal
        open={showCategory}
        onClose={() => {
          setShowCategory(false);
          setEditingCategory(null);
          setCatName('');
        }}
        title={editingCategory ? 'Editar categoria' : 'Nova categoria'}
      >
        <div className="space-y-4">
          <Input label="Nome" value={catName} onChange={(e) => setCatName(e.target.value)} />
          <Button className="w-full" onClick={handleSaveCategory} loading={loading}>
            {editingCategory ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={showItem}
        onClose={() => {
          setShowItem(false);
          resetItemForm();
        }}
        title={editingItem ? 'Editar item' : 'Novo item'}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
          />
          <Input
            label="Descrição"
            value={itemForm.description}
            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
          />
          <Input
            label="Preço"
            type="number"
            step="0.01"
            value={itemForm.price}
            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
          />
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={itemForm.category_id}
              onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Foto do produto</p>
            <div className="flex items-center gap-3">
              <MenuItemPhoto src={imagePreview || null} alt={itemForm.name || 'Produto'} size="md" />
              <label className="cursor-pointer text-sm font-medium text-amber-700">
                Escolher imagem
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => onPickImage(e.target.files?.[0])}
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">JPG, PNG ou WEBP, até 4 MB.</p>
          </div>
          <Button className="w-full" onClick={handleSaveItem} loading={loading}>
            {editingItem ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
