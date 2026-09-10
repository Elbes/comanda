import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const admin = createAdminClient();
  const { data: config } = await admin.from('establishment_config').select('name').limit(1).single();

  return (
    <main className="staff-shell flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-600 text-2xl font-bold text-white shadow-lg shadow-amber-600/30">
          CQ
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          {config?.name ?? 'Comanda QR'}
        </h1>
        <p className="mt-2 text-stone-600">Sistema de atendimento via QR Code</p>

        <div className="mt-8 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5">
          <p className="text-sm text-stone-500">
            Escaneie o QR Code da sua mesa para fazer pedidos.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-amber-600/25 hover:bg-amber-700"
          >
            Acesso da equipe
          </Link>
        </div>
      </div>
    </main>
  );
}
