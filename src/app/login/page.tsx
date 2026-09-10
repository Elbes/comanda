'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginStaff } from '@/lib/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginStaff(email, password);

    if (result.success && result.redirectTo) {
      router.push(result.redirectTo);
    } else {
      setError(result.error ?? 'Erro ao fazer login.');
      setLoading(false);
    }
  }

  return (
    <main className="staff-shell flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-600 text-2xl font-bold text-white shadow-lg shadow-amber-600/30">
            CQ
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Comanda QR</h1>
          <p className="mt-1 text-sm text-stone-500">Faça seu login para acessar a equipe</p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Entrar
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          Primeira vez?{' '}
          <a href="/gerencia/setup" className="font-semibold text-amber-700 underline-offset-2 hover:underline">
            Configurar administrador
          </a>
        </p>
      </div>
    </main>
  );
}
