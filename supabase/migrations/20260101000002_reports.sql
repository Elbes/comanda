-- Função auxiliar para relatório de itens mais vendidos
CREATE OR REPLACE FUNCTION public.get_top_selling_items(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  item_name TEXT,
  total_quantity BIGINT,
  total_revenue NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    mi.name AS item_name,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.quantity * oi.unit_price) AS total_revenue
  FROM order_items oi
  JOIN menu_items mi ON mi.id = oi.menu_item_id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status != 'cancelado'
    AND o.created_at >= now() - (days_back || ' days')::interval
  GROUP BY mi.name
  ORDER BY total_quantity DESC
  LIMIT 20;
$$;
