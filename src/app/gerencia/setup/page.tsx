import { createAdminClient } from '@/lib/supabase/admin';
import { SetupForm } from '@/components/gerencia/SetupForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from('system_users')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-amber-700">Sistema já configurado</h1>
          <p className="mt-2 text-gray-600">
            Já existe pelo menos um usuário cadastrado. Faça login para continuar.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-amber-600 px-6 py-3 text-white font-medium hover:bg-amber-700"
          >
            Ir para o login
          </Link>
        </div>
      </main>
    );
  }

  return <SetupForm />;
}
