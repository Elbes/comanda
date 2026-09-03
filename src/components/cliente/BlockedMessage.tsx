import type { Table } from '@/lib/types/database';

interface Props {
  reason: 'bloqueada' | 'pagamento';
  tableNumber: number;
}

export function BlockedMessage({ reason, tableNumber }: Props) {
  const messages = {
    bloqueada: {
      title: 'Mesa indisponível',
      text: 'Esta mesa está bloqueada no momento. Por favor, chame o garçom.',
    },
    pagamento: {
      title: 'Aguardando pagamento',
      text: 'Esta mesa está aguardando o fechamento da conta. Chame o garçom.',
    },
  };

  const msg = messages[reason];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-xl font-bold text-gray-900">{msg.title}</h1>
      <p className="mt-2 text-gray-600">Mesa {tableNumber}</p>
      <p className="mt-4 text-gray-500">{msg.text}</p>
    </main>
  );
}
