'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSystemUser, toggleUserActive } from '@/lib/actions/gerencia';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ROLE_LABELS } from '@/lib/utils/constants';
import type { SystemUser, UserRole } from '@/lib/types/database';

interface Props {
  users: SystemUser[];
}

export function UsuariosManager({ users: initialUsers }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'garcom' as UserRole,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!userForm.name.trim() || !userForm.email.trim() || userForm.password.length < 6) {
      setError('Preencha nome, e-mail e senha (mínimo 6 caracteres).');
      setLoading(false);
      return;
    }

    const result = await createSystemUser(
      userForm.email.trim(),
      userForm.password,
      userForm.name.trim(),
      userForm.role
    );

    if (result.success) {
      setMessage('Usuário criado com sucesso!');
      setUserForm({ name: '', email: '', password: '', role: 'garcom' });
      router.refresh();
    } else {
      setError(result.error ?? 'Erro ao criar usuário.');
    }
    setLoading(false);
  }

  async function handleToggleActive(user: SystemUser) {
    setLoading(true);
    const result = await toggleUserActive(user.id, !user.active);
    if (result.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
      );
      setMessage(`Usuário ${user.active ? 'desativado' : 'ativado'}.`);
      router.refresh();
    } else {
      setError(result.error ?? 'Erro ao atualizar usuário.');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold mb-1">Cadastrar usuário</h2>
        <p className="text-sm text-gray-500 mb-4">
          Crie contas para garçom, balcão ou gerência.
        </p>

        <form onSubmit={handleCreateUser} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nome completo"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              required
            />
            <Input
              label="E-mail (login)"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Senha"
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required
              minLength={6}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Papel</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
              >
                <option value="garcom">Garçom</option>
                <option value="balcao">Balcão</option>
                <option value="gerencia">Gerência</option>
              </select>
            </div>
          </div>

          <Button type="submit" loading={loading}>
            Cadastrar usuário
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Usuários do sistema ({users.length})</h2>

        {users.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum usuário cadastrado além do administrador.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge color="bg-amber-100 text-amber-800">
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    <Badge color={user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={user.active ? 'danger' : 'secondary'}
                  onClick={() => handleToggleActive(user)}
                  loading={loading}
                >
                  {user.active ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {message && <p className="text-center text-sm text-green-600">{message}</p>}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
