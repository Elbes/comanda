-- =============================================================================
-- Comanda QR - Schema inicial
-- =============================================================================

-- Enums
CREATE TYPE mesa_status AS ENUM ('livre', 'ocupada', 'bloqueada', 'aguardando_pagamento');
CREATE TYPE comanda_status AS ENUM ('aberta', 'fechada', 'cancelada');
CREATE TYPE pedido_status AS ENUM ('pendente', 'em_preparo', 'pronto', 'entregue', 'cancelado');
CREATE TYPE user_role AS ENUM ('garcom', 'balcao', 'gerencia');
CREATE TYPE divisao_tipo AS ENUM ('igual', 'por_pessoa', 'livre');
CREATE TYPE pagamento_forma AS ENUM ('dinheiro', 'debito', 'credito', 'pix');
CREATE TYPE aberta_por_tipo AS ENUM ('cliente', 'garcom');
CREATE TYPE lancado_por_tipo AS ENUM ('cliente', 'garcom');

-- -----------------------------------------------------------------------------
-- Configuração do estabelecimento (uma linha por instância)
-- -----------------------------------------------------------------------------
CREATE TABLE establishment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Meu Estabelecimento',
  service_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Mesas
-- -----------------------------------------------------------------------------
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status mesa_status NOT NULL DEFAULT 'livre',
  capacity INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tables_token ON tables(token);
CREATE INDEX idx_tables_status ON tables(status);

-- -----------------------------------------------------------------------------
-- Usuários do sistema (vinculados ao Supabase Auth)
-- -----------------------------------------------------------------------------
CREATE TABLE system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_users_auth ON system_users(auth_user_id);
CREATE INDEX idx_system_users_role ON system_users(role);

-- -----------------------------------------------------------------------------
-- Comandas
-- -----------------------------------------------------------------------------
CREATE TABLE comandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES tables(id),
  status comanda_status NOT NULL DEFAULT 'aberta',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opened_by aberta_por_tipo NOT NULL DEFAULT 'cliente',
  opened_by_user_id UUID REFERENCES system_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comandas_table ON comandas(table_id);
CREATE INDEX idx_comandas_status ON comandas(status);

-- -----------------------------------------------------------------------------
-- Pessoas da comanda
-- -----------------------------------------------------------------------------
CREATE TABLE comanda_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comanda_people_comanda ON comanda_people(comanda_id);
CREATE INDEX idx_comanda_people_session ON comanda_people(session_token);

-- -----------------------------------------------------------------------------
-- Cardápio
-- -----------------------------------------------------------------------------
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(available);

-- -----------------------------------------------------------------------------
-- Pedidos
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES comandas(id),
  person_id UUID NOT NULL REFERENCES comanda_people(id),
  status pedido_status NOT NULL DEFAULT 'pendente',
  launched_by lancado_por_tipo NOT NULL DEFAULT 'cliente',
  launched_by_user_id UUID REFERENCES system_users(id),
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_comanda ON orders(comanda_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  observation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- -----------------------------------------------------------------------------
-- Fechamento / Pagamento
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES comandas(id),
  division_type divisao_tipo NOT NULL DEFAULT 'igual',
  service_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  subtotal NUMERIC(10,2) NOT NULL,
  service_fee_amount NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  payment_method pagamento_forma NOT NULL,
  closed_by_user_id UUID REFERENCES system_users(id),
  closed_by_client BOOLEAN NOT NULL DEFAULT false,
  person_amounts JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_comanda ON payments(comanda_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- -----------------------------------------------------------------------------
-- Log de auditoria
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES system_users(id),
  session_token TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- -----------------------------------------------------------------------------
-- Funções auxiliares para RLS
-- -----------------------------------------------------------------------------

-- Token de sessão do cliente (header x-comanda-session)
CREATE OR REPLACE FUNCTION public.get_comanda_session_token()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.headers', true)::json->>'x-comanda-session',
    ''
  );
$$;

-- Papel do usuário autenticado (staff)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM system_users
  WHERE auth_user_id = auth.uid()
    AND active = true
  LIMIT 1;
$$;

-- ID do system_user autenticado
CREATE OR REPLACE FUNCTION public.get_system_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM system_users
  WHERE auth_user_id = auth.uid()
    AND active = true
  LIMIT 1;
$$;

-- Comanda da sessão do cliente
CREATE OR REPLACE FUNCTION public.get_client_comanda_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.comanda_id
  FROM comanda_people cp
  WHERE cp.session_token = public.get_comanda_session_token()
  LIMIT 1;
$$;

-- Pessoa da sessão do cliente
CREATE OR REPLACE FUNCTION public.get_client_person_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.id
  FROM comanda_people cp
  WHERE cp.session_token = public.get_comanda_session_token()
  LIMIT 1;
$$;

-- Verifica se staff tem papel específico
CREATE OR REPLACE FUNCTION public.has_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() = ANY(allowed_roles);
$$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tables_updated BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_comandas_updated BEFORE UPDATE ON comandas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_menu_categories_updated BEFORE UPDATE ON menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_menu_items_updated BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_system_users_updated BEFORE UPDATE ON system_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_establishment_config_updated BEFORE UPDATE ON establishment_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Habilitar Realtime nas tabelas relevantes
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE comandas;
