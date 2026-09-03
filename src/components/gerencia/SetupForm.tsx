'use client';

import { useState } from 'react';
import { setupInitialAdmin } from '@/lib/actions/gerencia';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function SetupForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await setupInitialAdmin(form.email, form.password, form.name);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error ?? 'Erro ao configurar.');
    }
    setLoading(false);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-700">Configuração concluída!</h1>
          <p className="mt-2 text-gray-600">
            Usuário de gerência criado. Faça login em{' '}
            <a href="/login" className="text-amber-700 underline">/login</a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-amber-700">Configuração inicial</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Crie o primeiro usuário de gerência
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Senha"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <Button type="submit" className="w-full" loading={loading}>
            Criar administrador
          </Button>
        </form>
      </div>
    </main>
  );
}
