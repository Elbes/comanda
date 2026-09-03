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
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500">Mesa</p>
          <h1 className="text-4xl font-bold text-amber-700">{table.number}</h1>
          <p className="mt-2 text-gray-600">
            {isNewComanda
              ? 'Bem-vindo! Informe seu nome para abrir a sua comanda.'
              : 'Informe seu nome para abrir a sua comanda nesta mesa.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como podemos te chamar?"
            required
            autoFocus
          />

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Abrir minha comanda
          </Button>
        </form>
      </div>
    </main>
  );
}
