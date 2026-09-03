import { createAdminClient } from '@/lib/supabase/admin';
import { logoutStaff } from '@/lib/actions/auth';
import { GarcomPanel } from '@/components/garcom/GarcomPanel';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function GarcomPage() {
  const admin = createAdminClient();

  const { data: tables } = await admin.from('tables').select('*').order('number');
  const { data: categories } = await admin.from('menu_categories').select('*').order('display_order');
  const { data: menuItems } = await admin.from('menu_items').select('*').order('display_order');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-700">Garçom</h1>
        <form action={logoutStaff}>
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </header>

      <div className="p-4">
        <GarcomPanel
          tables={tables ?? []}
          categories={categories ?? []}
          menuItems={menuItems ?? []}
        />
      </div>
    </div>
  );
}
