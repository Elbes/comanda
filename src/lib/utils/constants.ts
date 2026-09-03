export const SESSION_COOKIE_NAME = 'comanda_session';
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 horas

export const PEDIDO_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_preparo: 'Em preparo',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const MESA_STATUS_LABELS: Record<string, string> = {
  livre: 'Livre',
  ocupada: 'Ocupada',
  bloqueada: 'Bloqueada',
  aguardando_pagamento: 'Aguardando pagamento',
};

export const ROLE_LABELS: Record<string, string> = {
  garcom: 'Garçom',
  balcao: 'Balcão',
  gerencia: 'Gerência',
};

export const PAGAMENTO_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
  pix: 'PIX',
};

export const PEDIDO_STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  em_preparo: 'bg-blue-100 text-blue-800',
  pronto: 'bg-green-100 text-green-800',
  entregue: 'bg-gray-100 text-gray-600',
  cancelado: 'bg-red-100 text-red-800',
};
