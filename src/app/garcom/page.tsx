import { createAdminClient } from '@/lib/supabase/admin';
import { GarcomPanel } from '@/components/garcom/GarcomPanel';
import { StaffShell } from '@/components/ui/StaffShell';

export const dynamic = 'force-dynamic';

export default async function GarcomPage() {
  const admin = createAdminClient();

  const { data: tables } = await admin.from('tables').select('*').order('number');
  const { data: categories } = await admin.from('menu_categories').select('*').order('display_order');
  const { data: menuItems } = await admin.from('menu_items').select('*').order('display_order');

  return (
    <StaffShell title="Garçom">
      <GarcomPanel
        tables={tables ?? []}
        categories={categories ?? []}
        menuItems={menuItems ?? []}
      />
    </StaffShell>
  );
}
