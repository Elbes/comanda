import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const admin = createAdminClient();
  const { data: config } = await admin.from('establishment_config').select('name').limit(1).single();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-amber-700">
          {config?.name ?? 'Comanda QR'}
        </h1>
        <p className="mt-2 text-gray-600">
          Sistema de atendimento via QR Code
        </p>

        <div className="mt-8 space-y-3">
          <p className="text-sm text-gray-500">
            Escaneie o QR Code da sua mesa para fazer pedidos.
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Acesso da equipe
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
