-- =============================================================================
-- Comanda QR - Seed inicial
-- Execute após migrations: supabase db reset (local) ou manualmente em produção
-- =============================================================================

-- Configuração do estabelecimento
INSERT INTO establishment_config (name, service_fee_percent, contact_phone, contact_email, address)
VALUES (
  'Bar & Lanchonete Demo',
  10.00,
  '(11) 99999-0000',
  'contato@demo.com',
  'Rua Exemplo, 123 - Centro'
);

-- Mesas de exemplo (1 a 12)
INSERT INTO tables (number, capacity, status)
SELECT
  n,
  CASE WHEN n <= 4 THEN 2 WHEN n <= 8 THEN 4 ELSE 6 END,
  'livre'::mesa_status
FROM generate_series(1, 12) AS n;

-- Categorias do cardápio
INSERT INTO menu_categories (name, display_order) VALUES
  ('Bebidas', 1),
  ('Porções', 2),
  ('Lanches', 3),
  ('Sobremesas', 4);

-- Itens do cardápio
INSERT INTO menu_items (category_id, name, description, price, display_order, available)
SELECT c.id, v.name, v.description, v.price, v.ord, true
FROM menu_categories c
CROSS JOIN LATERAL (
  VALUES
    ('Bebidas', 'Refrigerante Lata', 'Coca-Cola, Guaraná ou Fanta', 6.00, 1),
    ('Bebidas', 'Água Mineral', 'Com ou sem gás', 4.00, 2),
    ('Bebidas', 'Suco Natural', 'Laranja, limão ou abacaxi', 10.00, 3),
    ('Bebidas', 'Chopp 300ml', 'Chopp gelado', 12.00, 4),
    ('Bebidas', 'Chopp 500ml', 'Chopp gelado', 18.00, 5),
    ('Porções', 'Batata Frita', 'Porção individual crocante', 22.00, 1),
    ('Porções', 'Frango à Passarinho', 'Porção para compartilhar', 35.00, 2),
    ('Porções', 'Calabresa Acebolada', 'Com pão de alho', 32.00, 3),
    ('Porções', 'Isca de Peixe', 'Com molho tártaro', 38.00, 4),
    ('Lanches', 'X-Burger', 'Hambúrguer, queijo, alface e tomate', 18.00, 1),
    ('Lanches', 'X-Bacon', 'Hambúrguer, bacon, queijo e molho especial', 24.00, 2),
    ('Lanches', 'X-Tudo', 'Completo com ovo, presunto e batata palha', 28.00, 3),
    ('Lanches', 'Misto Quente', 'Presunto e queijo na chapa', 14.00, 4),
    ('Sobremesas', 'Pudim', 'Pudim de leite condensado', 10.00, 1),
    ('Sobremesas', 'Petit Gateau', 'Com sorvete de creme', 22.00, 2)
) AS v(cat, name, description, price, ord)
WHERE c.name = v.cat;

-- NOTA: Usuário de gerência deve ser criado via Supabase Auth + system_users.
-- Após criar o usuário no Auth (email/senha), execute:
--
-- INSERT INTO system_users (auth_user_id, name, role)
-- VALUES ('<UUID do auth.users>', 'Administrador', 'gerencia');
--
-- Ou use a tela /gerencia/setup na primeira execução (se habilitada).
