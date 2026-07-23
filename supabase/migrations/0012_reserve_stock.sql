-- =============================================================
-- 0012_reserve_stock.sql — Reserva de stock atómica (tudo ou nada)
--
-- Problema que isto resolve: o placeOrder lia o stock, criava o pedido e só
-- depois dava baixa com decrement_stock(). Entre a leitura e a baixa havia uma
-- janela em que dois pedidos simultâneos do último artigo passavam ambos na
-- verificação. Pior: decrement_stock() fazia greatest(0, ...), por isso o
-- segundo pedido era aceite e o stock encaixava a zero — venda a mais, em
-- silêncio.
--
-- reserve_stock() fecha a janela: bloqueia as linhas envolvidas (FOR UPDATE),
-- verifica TODAS com os locks já seguros e só então dá baixa. Se faltar stock a
-- um artigo, não mexe em nenhum e devolve o nome do artigo em falta, para o
-- cliente receber uma mensagem concreta.
--
-- As linhas são bloqueadas por ordem de id: dois pedidos com artigos em comum
-- pegam nos locks sempre pela mesma ordem, o que evita deadlocks.
--
-- Chamadas pelo placeOrder (service role); não expostas a anon/authenticated.
-- =============================================================

-- Baixa de stock. Devolve {"ok": true} ou {"ok": false, "item": "<nome>"}.
-- p_items: [{"item_id": "<uuid>", "qty": <int>}, ...]
create or replace function public.reserve_stock(p_items jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_failed text;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', true);
  end if;

  -- 1. Bloqueia todas as linhas envolvidas, por ordem de id (anti-deadlock).
  --    A partir daqui mais ninguém lhes mexe até esta transação terminar.
  perform 1
    from menu_items m
   where m.id in (
     select (e->>'item_id')::uuid from jsonb_array_elements(p_items) e
   )
   order by m.id
     for update;

  -- 2. Já com os locks, verifica se algum artigo seguido não chega.
  --    (agrega por artigo: a mesma linha pode vir repetida com opções diferentes)
  select m.name into v_failed
    from (
      select (e->>'item_id')::uuid as item_id, sum((e->>'qty')::int) as qty
        from jsonb_array_elements(p_items) e
       group by 1
    ) w
    join menu_items m on m.id = w.item_id
   where m.track_stock and m.stock_qty < w.qty
   limit 1;

  if v_failed is not null then
    return jsonb_build_object('ok', false, 'item', v_failed);
  end if;

  -- 3. Todos chegam: dá baixa de uma vez.
  update menu_items m
     set stock_qty = m.stock_qty - w.qty
    from (
      select (e->>'item_id')::uuid as item_id, sum((e->>'qty')::int) as qty
        from jsonb_array_elements(p_items) e
       group by 1
    ) w
   where m.id = w.item_id and m.track_stock;

  return jsonb_build_object('ok', true);
end;
$$;

-- Devolve stock reservado. Usada como compensação quando a reserva corre bem
-- mas a gravação do pedido falha logo a seguir.
create or replace function public.release_stock(p_items jsonb)
returns void
language sql
as $$
  update menu_items m
     set stock_qty = m.stock_qty + w.qty
    from (
      select (e->>'item_id')::uuid as item_id, sum((e->>'qty')::int) as qty
        from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e
       group by 1
    ) w
   where m.id = w.item_id and m.track_stock;
$$;

revoke all on function public.reserve_stock(jsonb) from public, anon, authenticated;
revoke all on function public.release_stock(jsonb) from public, anon, authenticated;

-- decrement_stock() deixa de ser usada. Fica removida de propósito: clampava a
-- zero em vez de recusar, portanto qualquer uso futuro voltaria a vender a mais.
drop function if exists public.decrement_stock(uuid, integer);
