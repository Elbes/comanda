export type MesaStatus = 'livre' | 'ocupada' | 'bloqueada' | 'aguardando_pagamento';
export type ComandaStatus = 'aberta' | 'fechada' | 'cancelada';
export type PedidoStatus = 'pendente' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';
export type UserRole = 'garcom' | 'balcao' | 'gerencia';
export type DivisaoTipo = 'igual' | 'por_pessoa' | 'livre';
export type PagamentoForma = 'dinheiro' | 'debito' | 'credito' | 'pix';
export type AbertaPorTipo = 'cliente' | 'garcom';
export type LancadoPorTipo = 'cliente' | 'garcom';

export interface EstablishmentConfig {
  id: string;
  name: string;
  service_fee_percent: number;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
}

export interface Table {
  id: string;
  number: number;
  token: string;
  status: MesaStatus;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface Comanda {
  id: string;
  table_id: string;
  status: ComandaStatus;
  opened_at: string;
  closed_at: string | null;
  opened_by: AbertaPorTipo;
  opened_by_user_id: string | null;
}

export interface ComandaPerson {
  id: string;
  comanda_id: string;
  name: string;
  session_token: string;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  display_order: number;
}

export interface Order {
  id: string;
  comanda_id: string;
  person_id: string;
  status: PedidoStatus;
  launched_by: LancadoPorTipo;
  launched_by_user_id: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  observation: string | null;
  menu_item?: MenuItem;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  comanda_person?: ComandaPerson;
  table?: Table;
}

export interface SystemUser {
  id: string;
  auth_user_id: string;
  name: string;
  role: UserRole;
  active: boolean;
}

export interface Payment {
  id: string;
  comanda_id: string;
  division_type: DivisaoTipo;
  service_fee_percent: number;
  subtotal: number;
  service_fee_amount: number;
  total: number;
  payment_method: PagamentoForma;
  closed_by_user_id: string | null;
  closed_by_client: boolean;
  person_amounts: Record<string, number> | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  session_token: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string;
}

export interface CloseAccountInput {
  comandaId: string;
  divisionType: DivisaoTipo;
  paymentMethod: PagamentoForma;
  personAmounts?: Record<string, number>;
  closedByClient?: boolean;
}

export interface CloseAccountResult {
  subtotal: number;
  serviceFeePercent: number;
  serviceFeeAmount: number;
  total: number;
  personTotals: Record<string, number>;
}
