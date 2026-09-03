'use client';

import { useState } from 'react';
import { updateEstablishmentConfig } from '@/lib/actions/gerencia';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { EstablishmentConfig } from '@/lib/types/database';

interface Props {
  config: EstablishmentConfig | null;
}

export function ConfigManager({ config }: Props) {
  const [form, setForm] = useState({
    name: config?.name ?? '',
    service_fee_percent: String(config?.service_fee_percent ?? 10),
    contact_phone: config?.contact_phone ?? '',
    contact_email: config?.contact_email ?? '',
    address: config?.address ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSaveConfig() {
    setLoading(true);
    const result = await updateEstablishmentConfig({
      name: form.name,
      service_fee_percent: parseFloat(form.service_fee_percent),
      contact_phone: form.contact_phone || undefined,
      contact_email: form.contact_email || undefined,
      address: form.address || undefined,
    });
    setMessage(result.success ? 'Configuração salva!' : result.error ?? 'Erro');
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold mb-4">Estabelecimento</h3>
        <div className="space-y-3">
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input
            label="Taxa de serviço (%)"
            type="number"
            step="0.5"
            value={form.service_fee_percent}
            onChange={(e) => setForm({ ...form, service_fee_percent: e.target.value })}
          />
          <Input label="Telefone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          <Input label="E-mail" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          <Input label="Endereço" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Button onClick={handleSaveConfig} loading={loading}>Salvar</Button>
        </div>
      </Card>

      {message && <p className="text-sm text-center text-green-600">{message}</p>}
    </div>
  );
}
