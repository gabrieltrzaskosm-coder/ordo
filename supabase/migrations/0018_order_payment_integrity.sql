-- =============================================================
-- 0018_order_payment_integrity.sql — pedido/estoque e pagamento atômicos
--
-- Reserva de estoque, gravação do pedido e suas linhas eram operações HTTP
-- separadas. Um erro no meio podia persistir parte do pedido e compensar o
-- estoque incorretamente. Este arquivo concentra cada transição crítica em
-- uma função PostgreSQL: uma function roda dentro de uma única transação.
-- =============================================================

-- `NULL` identifica pedidos legados, criados antes desta migration. Pedidos
-- novos gravam o delta exato baixado; só ele é devolvido em um cancelamento.
alter table orders add column if not exists stock_reservation jsonb;

-- Um pedido só pode ter um pagamento confirmado. A consulta de auditoria antes
-- desta migration confirmou que não há pagamentos confirmados duplicados.
create unique index if not exists payments_one_paid_per_order_uidx
  on payments(order_id)
  where status = 'paid';

-- Fecha a mesa sem janela entre "todos concluídos?" e o UPDATE. A trava da mesa
-- também é compartilhada com a criação de pedido, logo um pedido novo não pode
-- aparecer no meio da decisão e ser fechado junto com os anteriores.
create or replace function public.close_table_if_complete(p_table_id uuid)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  perform 1
    from restaurant_tables
   where id = p_table_id
   for update;
  if not found then return false; end if;

  if exists (
    select 1
      from orders
     where table_id = p_table_id
       and closed_at is null
       and status <> 'cancelled'
       and (status <> 'served' or paid_at is null)
  ) then
    return false;
  end if;

  update orders
     set closed_at = now(), updated_at = now()
   where table_id = p_table_id
     and closed_at is null
     and status <> 'cancelled'
     and status = 'served'
     and paid_at is not null;

  return found;
end;
$$;

-- Cria pedido, linhas, extras e baixa de estoque como uma operação indivisível.
-- O payload já foi validado/preçado no servidor; mesmo assim, a função confirma
-- estabelecimento, mesa, artigos e extras antes de escrever.
create or replace function public.create_order_with_stock(
  p_establishment_id uuid,
  p_table_id uuid,
  p_customer_name text,
  p_subtotal_cents integer,
  p_order_items jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order_items jsonb := coalesce(p_order_items, '[]'::jsonb);
  v_stock_items jsonb := '[]'::jsonb;
  v_stock_ingredients jsonb := '[]'::jsonb;
  v_order_id uuid;
  v_order_item_id uuid;
  v_line jsonb;
  v_modifier jsonb;
  v_failed text;
begin
  if jsonb_typeof(v_order_items) <> 'array' or jsonb_array_length(v_order_items) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_order');
  end if;

  -- A mesma trava é usada no fecho da mesa para não fechar um pedido novo.
  perform 1
    from restaurant_tables
   where id = p_table_id
     and establishment_id = p_establishment_id
     and active
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'table_not_found');
  end if;

  if exists (
    select 1
      from jsonb_array_elements(v_order_items) as line(value)
      left join menu_items m on m.id = (line.value ->> 'menu_item_id')::uuid
     where m.id is null
        or m.establishment_id is distinct from p_establishment_id
        or not m.available
        or coalesce((line.value ->> 'qty')::integer, 0) <= 0
  ) then
    return jsonb_build_object('ok', false, 'error', 'invalid_item');
  end if;

  if exists (
    select 1
      from jsonb_array_elements(v_order_items) as line(value)
      cross join lateral jsonb_array_elements(
        coalesce(line.value -> 'modifiers', '[]'::jsonb)
      ) as modifier(value)
      left join modifiers m on m.id = (modifier.value ->> 'modifier_id')::uuid
     where m.id is null
        or m.establishment_id is distinct from p_establishment_id
        or not m.available
        or not exists (
          select 1
            from item_modifier_groups link
           where link.establishment_id = p_establishment_id
             and link.menu_item_id = (line.value ->> 'menu_item_id')::uuid
             and link.group_id = m.group_id
        )
  ) then
    return jsonb_build_object('ok', false, 'error', 'invalid_modifier');
  end if;

  -- Calcula a reserva dentro da transação, a partir da configuração atual.
  select coalesce(
    jsonb_agg(jsonb_build_object('item_id', item_id, 'qty', qty)),
    '[]'::jsonb
  )
    into v_stock_items
    from (
      select m.id as item_id, sum((line.value ->> 'qty')::integer) as qty
        from jsonb_array_elements(v_order_items) as line(value)
        join menu_items m on m.id = (line.value ->> 'menu_item_id')::uuid
       where m.establishment_id = p_establishment_id
         and m.track_stock
       group by m.id
    ) stock_items;

  select coalesce(
    jsonb_agg(jsonb_build_object('ingredient_id', ingredient_id, 'qty', qty)),
    '[]'::jsonb
  )
    into v_stock_ingredients
    from (
      select ingredient_id, sum(qty) as qty
        from (
          select ri.ingredient_id,
                 ri.qty * (line.value ->> 'qty')::integer as qty
            from jsonb_array_elements(v_order_items) as line(value)
            join recipe_items ri
              on ri.menu_item_id = (line.value ->> 'menu_item_id')::uuid
             and ri.establishment_id = p_establishment_id
          union all
          select ri.ingredient_id,
                 ri.qty * (line.value ->> 'qty')::integer as qty
            from jsonb_array_elements(v_order_items) as line(value)
            cross join lateral jsonb_array_elements(
              coalesce(line.value -> 'modifiers', '[]'::jsonb)
            ) as modifier(value)
            join recipe_items ri
              on ri.modifier_id = (modifier.value ->> 'modifier_id')::uuid
             and ri.establishment_id = p_establishment_id
        ) needs
       group by ingredient_id
    ) stock_ingredients;

  -- Sempre menu_items antes de ingredients: a mesma ordem de lock evita
  -- deadlocks quando dois pedidos disputam os mesmos recursos.
  perform 1
    from menu_items m
   where m.establishment_id = p_establishment_id
     and m.id in (
       select (entry.value ->> 'item_id')::uuid
         from jsonb_array_elements(v_stock_items) as entry(value)
     )
   order by m.id
   for update;

  perform 1
    from ingredients g
   where g.establishment_id = p_establishment_id
     and g.id in (
       select (entry.value ->> 'ingredient_id')::uuid
         from jsonb_array_elements(v_stock_ingredients) as entry(value)
     )
   order by g.id
   for update;

  select m.name into v_failed
    from (
      select (entry.value ->> 'item_id')::uuid as item_id,
             sum((entry.value ->> 'qty')::integer) as qty
        from jsonb_array_elements(v_stock_items) as entry(value)
       group by 1
    ) wanted
    join menu_items m on m.id = wanted.item_id
   where m.establishment_id = p_establishment_id
     and m.track_stock
     and m.stock_qty < wanted.qty
   limit 1;
  if v_failed is not null then
    return jsonb_build_object('ok', false, 'error', 'out_of_stock', 'item', v_failed);
  end if;

  select g.name into v_failed
    from (
      select (entry.value ->> 'ingredient_id')::uuid as ingredient_id,
             sum((entry.value ->> 'qty')::integer) as qty
        from jsonb_array_elements(v_stock_ingredients) as entry(value)
       group by 1
    ) wanted
    join ingredients g on g.id = wanted.ingredient_id
   where g.establishment_id = p_establishment_id
     and g.stock_qty < wanted.qty
   limit 1;
  if v_failed is not null then
    return jsonb_build_object('ok', false, 'error', 'out_of_stock', 'item', v_failed);
  end if;

  update menu_items m
     set stock_qty = m.stock_qty - wanted.qty
    from (
      select (entry.value ->> 'item_id')::uuid as item_id,
             sum((entry.value ->> 'qty')::integer) as qty
        from jsonb_array_elements(v_stock_items) as entry(value)
       group by 1
    ) wanted
   where m.id = wanted.item_id
     and m.establishment_id = p_establishment_id
     and m.track_stock;

  update ingredients g
     set stock_qty = g.stock_qty - wanted.qty
    from (
      select (entry.value ->> 'ingredient_id')::uuid as ingredient_id,
             sum((entry.value ->> 'qty')::integer) as qty
        from jsonb_array_elements(v_stock_ingredients) as entry(value)
       group by 1
    ) wanted
   where g.id = wanted.ingredient_id
     and g.establishment_id = p_establishment_id;

  insert into orders (
    establishment_id,
    table_id,
    customer_name,
    status,
    subtotal_cents,
    total_cents,
    stock_reservation
  ) values (
    p_establishment_id,
    p_table_id,
    p_customer_name,
    'placed',
    p_subtotal_cents,
    p_subtotal_cents,
    jsonb_build_object('items', v_stock_items, 'ingredients', v_stock_ingredients)
  ) returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(v_order_items) loop
    insert into order_items (
      establishment_id,
      order_id,
      menu_item_id,
      name_snapshot,
      unit_price_cents,
      qty,
      notes
    ) values (
      p_establishment_id,
      v_order_id,
      (v_line ->> 'menu_item_id')::uuid,
      v_line ->> 'name_snapshot',
      (v_line ->> 'unit_price_cents')::integer,
      (v_line ->> 'qty')::integer,
      v_line ->> 'notes'
    ) returning id into v_order_item_id;

    for v_modifier in select value from jsonb_array_elements(
      coalesce(v_line -> 'modifiers', '[]'::jsonb)
    ) loop
      insert into order_item_modifiers (
        establishment_id,
        order_item_id,
        modifier_id,
        name_snapshot,
        price_delta_cents
      ) values (
        p_establishment_id,
        v_order_item_id,
        (v_modifier ->> 'modifier_id')::uuid,
        v_modifier ->> 'name_snapshot',
        (v_modifier ->> 'price_delta_cents')::integer
      );
    end loop;
  end loop;

  return jsonb_build_object('ok', true, 'order_id', v_order_id);
end;
$$;

-- Cancela uma vez e devolve apenas o delta que foi efetivamente reservado no
-- momento da criação. Pedidos legados não têm snapshot e permanecem seguros:
-- são cancelados, mas não recebem uma reposição estimada que poderia vender a
-- mais caso a receita ou o controle de estoque tenha mudado desde então.
create or replace function public.cancel_order_and_release_stock(
  p_establishment_id uuid,
  p_order_id uuid
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_table_id uuid;
  v_status order_status;
  v_reservation jsonb;
  v_stock_items jsonb := '[]'::jsonb;
  v_stock_ingredients jsonb := '[]'::jsonb;
  v_released boolean := false;
begin
  select table_id, status, stock_reservation
    into v_table_id, v_status, v_reservation
    from orders
   where id = p_order_id
     and establishment_id = p_establishment_id
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;

  if v_status = 'cancelled' then
    return jsonb_build_object('ok', true, 'already_cancelled', true, 'table_id', v_table_id);
  end if;

  -- Mantém a mesma ordem de locks de create_order_with_stock().
  perform 1 from restaurant_tables where id = v_table_id for update;

  if v_reservation is not null then
    v_stock_items := coalesce(v_reservation -> 'items', '[]'::jsonb);
    v_stock_ingredients := coalesce(v_reservation -> 'ingredients', '[]'::jsonb);

    perform 1
      from menu_items m
     where m.establishment_id = p_establishment_id
       and m.id in (
         select (entry.value ->> 'item_id')::uuid
           from jsonb_array_elements(v_stock_items) as entry(value)
       )
     order by m.id
     for update;

    perform 1
      from ingredients g
     where g.establishment_id = p_establishment_id
       and g.id in (
         select (entry.value ->> 'ingredient_id')::uuid
           from jsonb_array_elements(v_stock_ingredients) as entry(value)
       )
     order by g.id
     for update;

    update menu_items m
       set stock_qty = m.stock_qty + wanted.qty
      from (
        select (entry.value ->> 'item_id')::uuid as item_id,
               sum((entry.value ->> 'qty')::integer) as qty
          from jsonb_array_elements(v_stock_items) as entry(value)
         group by 1
      ) wanted
     where m.id = wanted.item_id
       and m.establishment_id = p_establishment_id;

    update ingredients g
       set stock_qty = g.stock_qty + wanted.qty
      from (
        select (entry.value ->> 'ingredient_id')::uuid as ingredient_id,
               sum((entry.value ->> 'qty')::integer) as qty
          from jsonb_array_elements(v_stock_ingredients) as entry(value)
         group by 1
      ) wanted
     where g.id = wanted.ingredient_id
       and g.establishment_id = p_establishment_id;

    v_released := true;
  end if;

  update orders
     set status = 'cancelled', updated_at = now()
   where id = p_order_id;

  perform public.close_table_if_complete(v_table_id);
  return jsonb_build_object(
    'ok', true,
    'table_id', v_table_id,
    'stock_released', v_released,
    'legacy_reservation', v_reservation is null
  );
end;
$$;

-- Marca pagamento manual com lock da linha e chave idempotente. A proteção é
-- dupla: o lock impede a corrida e o índice parcial impede duas confirmações
-- pagas para o mesmo pedido mesmo se outro fluxo for adicionado no futuro.
create or replace function public.mark_order_paid(
  p_establishment_id uuid,
  p_order_id uuid
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_table_id uuid;
  v_total_cents integer;
  v_paid_at timestamptz;
  v_status order_status;
begin
  select table_id, total_cents, paid_at, status
    into v_table_id, v_total_cents, v_paid_at, v_status
    from orders
   where id = p_order_id
     and establishment_id = p_establishment_id
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;

  if v_status = 'cancelled' then
    return jsonb_build_object('ok', false, 'error', 'cancelled_order');
  end if;

  if v_paid_at is not null then
    return jsonb_build_object('ok', true, 'already_paid', true, 'table_id', v_table_id);
  end if;

  update orders
     set paid_at = now(), updated_at = now()
   where id = p_order_id;

  insert into payments (
    establishment_id,
    order_id,
    provider,
    method,
    amount_cents,
    status,
    idempotency_key
  ) values (
    p_establishment_id,
    p_order_id,
    'manual',
    'cash',
    v_total_cents,
    'paid',
    'manual:' || p_order_id::text
  ) on conflict (idempotency_key) do nothing;

  perform public.close_table_if_complete(v_table_id);
  return jsonb_build_object('ok', true, 'table_id', v_table_id);
end;
$$;

revoke all on function public.close_table_if_complete(uuid) from public, anon, authenticated;
revoke all on function public.create_order_with_stock(uuid, uuid, text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.cancel_order_and_release_stock(uuid, uuid) from public, anon, authenticated;
revoke all on function public.mark_order_paid(uuid, uuid) from public, anon, authenticated;
