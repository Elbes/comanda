'use client';

import { useState } from 'react';
import { toggleMenuItemAvailability } from '@/lib/actions/gerencia';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { MenuItem, MenuCategory } from '@/lib/types/database';

interface Props {
  categories: MenuCategory[];
  items: MenuItem[];
}

export function MenuAvailabilityPanel({ categories, items }: Props) {
  const [menuItems, setMenuItems] = useState(items);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleItem(itemId: string, available: boolean) {
    setLoading(itemId);
    const result = await toggleMenuItemAvailability(itemId, !available);
    if (result.success) {
      setMenuItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, available: !available } : i))
      );
    }
    setLoading(null);
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const catItems = menuItems.filter((i) => i.category_id === cat.id);
        if (!catItems.length) return null;

        return (
          <div key={cat.id}>
            <h3 className="font-semibold text-gray-700 mb-2">{cat.name}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {catItems.map((item) => (
                <Card key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className={`text-xs ${item.available ? 'text-green-600' : 'text-red-600'}`}>
                      {item.available ? 'Disponível' : 'Esgotado'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={item.available ? 'danger' : 'primary'}
                    onClick={() => toggleItem(item.id, item.available)}
                    loading={loading === item.id}
                  >
                    {item.available ? 'Esgotar' : 'Disponibilizar'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
