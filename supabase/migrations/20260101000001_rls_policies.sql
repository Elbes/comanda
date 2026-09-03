-- =============================================================================
-- Comanda QR - Row Level Security
-- =============================================================================

ALTER TABLE establishment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- establishment_config
-- -----------------------------------------------------------------------------
CREATE POLICY "config_select_all" ON establishment_config
  FOR SELECT USING (true);

CREATE POLICY "config_update_gerencia" ON establishment_config
  FOR UPDATE USING (public.has_role(ARRAY['gerencia']));

-- -----------------------------------------------------------------------------
-- tables (mesas)
-- -----------------------------------------------------------------------------
CREATE POLICY "tables_select_all" ON tables
  FOR SELECT USING (true);

CREATE POLICY "tables_insert_gerencia" ON tables
  FOR INSERT WITH CHECK (public.has_role(ARRAY['gerencia']));

CREATE POLICY "tables_update_staff" ON tables
  FOR UPDATE USING (public.has_role(ARRAY['garcom', 'balcao', 'gerencia']));

CREATE POLICY "tables_delete_gerencia" ON tables
  FOR DELETE USING (public.has_role(ARRAY['gerencia']));

-- -----------------------------------------------------------------------------
-- system_users
-- -----------------------------------------------------------------------------
CREATE POLICY "system_users_select_gerencia" ON system_users
  FOR SELECT USING (
    public.has_role(ARRAY['gerencia'])
    OR auth_user_id = auth.uid()
  );

CREATE POLICY "system_users_insert_gerencia" ON system_users
  FOR INSERT WITH CHECK (public.has_role(ARRAY['gerencia']));

CREATE POLICY "system_users_update_gerencia" ON system_users
  FOR UPDATE USING (public.has_role(ARRAY['gerencia']));

CREATE POLICY "system_users_delete_gerencia" ON system_users
  FOR DELETE USING (public.has_role(ARRAY['gerencia']));

-- -----------------------------------------------------------------------------
-- comandas
-- -----------------------------------------------------------------------------
CREATE POLICY "comandas_select_client" ON comandas
  FOR SELECT USING (
    id = public.get_client_comanda_id()
    OR public.has_role(ARRAY['garcom', 'balcao', 'gerencia'])
  );

CREATE POLICY "comandas_insert_staff" ON comandas
  FOR INSERT WITH CHECK (public.has_role(ARRAY['garcom', 'balcao', 'gerencia']));

CREATE POLICY "comandas_update_staff" ON comandas
  FOR UPDATE USING (public.has_role(ARRAY['garcom', 'balcao', 'gerencia']));

-- -----------------------------------------------------------------------------
-- comanda_people
-- -----------------------------------------------------------------------------
CREATE POLICY "comanda_people_select" ON comanda_people
  FOR SELECT USING (
    comanda_id = public.get_client_comanda_id()
    OR public.has_role(ARRAY['garcom', 'balcao', 'gerencia'])
  );

CREATE POLICY "comanda_people_insert_staff" ON comanda_people
  FOR INSERT WITH CHECK (public.has_role(ARRAY['garcom', 'balcao', 'gerencia']));

-- -----------------------------------------------------------------------------
-- menu_categories
-- -----------------------------------------------------------------------------
CREATE POLICY "menu_categories_select_all" ON menu_categories
  FOR SELECT USING (true);

CREATE POLICY "menu_categories_write_gerencia" ON menu_categories
  FOR ALL USING (public.has_role(ARRAY['gerencia']));

-- -----------------------------------------------------------------------------
-- menu_items
-- -----------------------------------------------------------------------------
CREATE POLICY "menu_items_select_all" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "menu_items_update_balcao_gerencia" ON menu_items
  FOR UPDATE USING (public.has_role(ARRAY['balcao', 'gerencia']));

CREATE POLICY "menu_items_insert_gerencia" ON menu_items
  FOR INSERT WITH CHECK (public.has_role(ARRAY['gerencia']));

CREATE POLICY "menu_items_delete_gerencia" ON menu_items
  FOR DELETE USING (public.has_role(ARRAY['gerencia']));

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
CREATE POLICY "orders_select" ON orders
  FOR SELECT USING (
    comanda_id = public.get_client_comanda_id()
    OR public.has_role(ARRAY['garcom', 'balcao', 'gerencia'])
  );

CREATE POLICY "orders_insert_client" ON orders
  FOR INSERT WITH CHECK (
    comanda_id = public.get_client_comanda_id()
    AND person_id = public.get_client_person_id()
  );

CREATE POLICY "orders_insert_staff" ON orders
  FOR INSERT WITH CHECK (public.has_role(ARRAY['garcom', 'balcao', 'gerencia']));

CREATE POLICY "orders_update_staff" ON orders
  FOR UPDATE USING (public.has_role(ARRAY['garcom', 'balcao', 'gerencia']));

-- -----------------------------------------------------------------------------
-- order_items
-- -----------------------------------------------------------------------------
CREATE POLICY "order_items_select" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (
          o.comanda_id = public.get_client_comanda_id()
          OR public.has_role(ARRAY['garcom', 'balcao', 'gerencia'])
        )
    )
  );

CREATE POLICY "order_items_insert_client" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.comanda_id = public.get_client_comanda_id()
        AND o.person_id = public.get_client_person_id()
    )
  );

CREATE POLICY "order_items_insert_staff" ON order_items
  FOR INSERT WITH CHECK (public.has_role(ARRAY['garcom', 'balcao', 'gerencia']));

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------
CREATE POLICY "payments_select_staff" ON payments
  FOR SELECT USING (public.has_role(ARRAY['garcom', 'balcao', 'gerencia']));

CREATE POLICY "payments_insert_staff" ON payments
  FOR INSERT WITH CHECK (public.has_role(ARRAY['garcom', 'balcao', 'gerencia']));

-- -----------------------------------------------------------------------------
-- audit_logs
-- -----------------------------------------------------------------------------
CREATE POLICY "audit_logs_select_gerencia" ON audit_logs
  FOR SELECT USING (public.has_role(ARRAY['gerencia']));

CREATE POLICY "audit_logs_insert_staff" ON audit_logs
  FOR INSERT WITH CHECK (public.has_role(ARRAY['garcom', 'balcao', 'gerencia']));
