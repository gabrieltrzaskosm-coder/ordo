-- =============================================================
-- 0011_decrement_stock.sql — Baixa de stock atómica
--
-- Um único UPDATE evita o race de leitura-escrita (duas encomendas simultâneas
-- do mesmo artigo não perdem uma baixa). greatest(0, ...) nunca deixa negativo.
-- Chamada pelo placeOrder (service role); não exposta a anon/authenticated.
-- =============================================================

create or replace function public.decrement_stock(p_item_id uuid, p_amount integer)
returns void
language sql
as $$
  update menu_items
  set stock_qty = greatest(0, stock_qty - p_amount)
  where id = p_item_id and track_stock;
$$;

revoke all on function public.decrement_stock(uuid, integer) from public, anon, authenticated;
