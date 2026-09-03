'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createMesa,
  updateMesa,
  deleteMesa,
  regenerateTableToken,
} from '@/lib/actions/gerencia';
import { getTableAccessUrl, generateQRCodeDataUrl } from '@/lib/actions/qrcode';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { MESA_STATUS_LABELS } from '@/lib/utils/constants';
import type { Table } from '@/lib/types/database';

interface Props {
  tables: Table[];
}

export function MesasManager({ tables: initialTables }: Props) {
  const router = useRouter();
  const [tables, setTables] = useState(initialTables);
  const [showCreate, setShowCreate] = useState(false);
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [qrModal, setQrModal] = useState<{ table: Table; qrDataUrl: string; url: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    const result = await createMesa(parseInt(number, 10), parseInt(capacity, 10));
    if (result.success) {
      setShowCreate(false);
      setNumber('');
      router.refresh();
    }
    setLoading(false);
  }

  async function handleShowQR(table: Table) {
    const url = await getTableAccessUrl(table.token);
    const qrDataUrl = await generateQRCodeDataUrl(url);
    setQrModal({ table, qrDataUrl, url });
  }

  async function handleRegenerateToken(tableId: string) {
    if (!confirm('Regenerar o QR Code invalidará o anterior. Continuar?')) return;
    setLoading(true);
    const result = await regenerateTableToken(tableId);
    if (result.success) {
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(tableId: string) {
    if (!confirm('Remover esta mesa?')) return;
    setLoading(true);
    await deleteMesa(tableId);
    router.refresh();
    setLoading(false);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Mesas ({tables.length})</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => window.open('/gerencia/mesas/imprimir', '_blank')}>
            Imprimir QRs
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            Nova mesa
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <Card key={table.id}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold">Mesa {table.number}</h3>
              <Badge>{MESA_STATUS_LABELS[table.status]}</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-3">Capacidade: {table.capacity}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleShowQR(table)}>
                QR Code
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleRegenerateToken(table.id)}
                loading={loading}
              >
                Regenerar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(table.id)}
              >
                Remover
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova mesa">
        <div className="space-y-4">
          <Input
            label="Número"
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <Input
            label="Capacidade"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <Button className="w-full" onClick={handleCreate} loading={loading}>
            Criar mesa
          </Button>
        </div>
      </Modal>

      <Modal open={!!qrModal} onClose={() => setQrModal(null)} title={`QR Code — Mesa ${qrModal?.table.number}`}>
        {qrModal && (
          <div className="text-center space-y-4">
            <img src={qrModal.qrDataUrl} alt="QR Code" className="mx-auto w-64 h-64" />
            <p className="text-xs text-gray-500 break-all">{qrModal.url}</p>
            <Button
              variant="secondary"
              onClick={() => window.print()}
            >
              Imprimir
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
