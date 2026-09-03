'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createMenuCategory,
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function resetItemForm() {
    setItemForm({ name: '', description: '', price: '', category_id: categories[0]?.id ?? '' });
    setImageFile(null);
    setImagePreview('');
  }

  function onPickCreateImage(file: File | undefined) {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return uploadMenuItemImage(formData);
  }

  async function handleCreateCategory() {
    setLoading(true);
    await createMenuCategory(catName, categories.length + 1);
    setShowCategory(false);
    setCatName('');
    router.refresh();
    setLoading(false);
  }

  async function handleCreateItem() {
    setError('');
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

    const result = await createMenuItem({
      category_id: itemForm.category_id,
      name: itemForm.name,
      description: itemForm.description || undefined,
      price: parseFloat(itemForm.price),
      image_url: imageUrl,
    });
    if (!result.success) {
      setError(result.error ?? 'Erro ao criar item.');
      setLoading(false);
      return;
    }
    setShowItem(false);
    resetItemForm();
    router.refresh();
    setLoading(false);
  }

  async function handleChangePhoto(itemId: string, file: File | undefined) {
    if (!file) return;
    setError('');
    setUploadingId(itemId);
    const uploaded = await uploadImage(file);
    if (!uploaded.success || !uploaded.url) {
      setError(uploaded.error ?? 'Erro ao enviar a imagem.');
      setUploadingId(null);
      return;
    }
    await updateMenuItem(itemId, { image_url: uploaded.url });
    setUploadingId(null);
    router.refresh();
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
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

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
                <Card key={item.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <MenuItemPhoto src={item.image_url} alt={item.name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(Number(item.price))} •{' '}
                        {item.available ? 'Disponível' : 'Indisponível'}
                      </p>
                      <label className="mt-1 inline-block cursor-pointer text-xs font-medium text-amber-700">
                        {uploadingId === item.id ? 'Enviando...' : item.image_url ? 'Trocar foto' : 'Adicionar foto'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={uploadingId === item.id}
                          onChange={(e) => {
                            handleChangePhoto(item.id, e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
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

      <Modal
        open={showItem}
        onClose={() => {
          setShowItem(false);
          resetItemForm();
        }}
        title="Novo item"
      >
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
                  onChange={(e) => onPickCreateImage(e.target.files?.[0])}
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">JPG, PNG ou WEBP, até 4 MB.</p>
          </div>
          <Button className="w-full" onClick={handleCreateItem} loading={loading}>Criar</Button>
        </div>
      </Modal>
    </div>
  );
}
