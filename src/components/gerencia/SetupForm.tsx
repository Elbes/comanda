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
      <main className="staff-shell flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-stone-200/80 bg-white p-8 text-center shadow-xl shadow-stone-900/5">
          <h1 className="text-2xl font-bold text-green-700">Configuração concluída!</h1>
          <p className="mt-2 text-stone-600">
            Usuário de gerência criado. Faça login em{' '}
            <a href="/login" className="font-semibold text-amber-700 underline">
              /login
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="staff-shell flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Configuração inicial</h1>
          <p className="mt-1 text-sm text-stone-500">Crie o primeiro usuário de gerência</p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Criar administrador
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
