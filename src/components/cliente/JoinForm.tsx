'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinComanda } from '@/lib/actions/comanda';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Table } from '@/lib/types/database';

interface Props {
  table: Table;
}

export function JoinForm({ table }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await joinComanda(table.token, name);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Erro ao entrar na comanda.');
      setLoading(false);
    }
  }

  const isNewComanda = table.status === 'livre';

  return (
    <main className="client-shell flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700/80">
            Mesa
          </p>
          <h1 className="mt-1 text-5xl font-bold tracking-tight text-stone-900">{table.number}</h1>
          <p className="mt-3 text-stone-600">
            {isNewComanda
              ? 'Bem-vindo! Informe seu nome para abrir a sua comanda.'
              : 'Informe seu nome para abrir a sua comanda nesta mesa.'}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-xl shadow-stone-900/5 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como podemos te chamar?"
              required
              autoFocus
            />

            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Abrir minha comanda
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
