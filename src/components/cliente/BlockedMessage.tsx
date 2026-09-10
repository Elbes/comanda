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
    <main className="client-shell flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm rounded-3xl border border-stone-200/80 bg-white p-8 shadow-xl shadow-stone-900/5">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-2xl">
          !
        </div>
        <h1 className="text-xl font-bold tracking-tight text-stone-900">{msg.title}</h1>
        <p className="mt-1 text-sm font-medium text-amber-700">Mesa {tableNumber}</p>
        <p className="mt-4 text-stone-500">{msg.text}</p>
      </div>
    </main>
  );
}
