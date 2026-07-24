-- =============================================================
-- 0013_ingredient_stock.sql — Stock ao nível do ingrediente (plano Max)
--
-- Até aqui o stock era por prato (menu_items.stock_qty). Agora há um inventário
-- de ingredientes e uma "receita" que liga pratos E extras aos ingredientes que
-- gastam. Um hambúrguer que precisa de 1 pão desaparece do menu quando o pão
-- chega a zero; um extra "Bacon" some quando o bacon acaba.
--
-- Contagem simples: tudo em unidades inteiras (1 pão, 1 fatia de bacon). Sem
-- pesos/decimais — foi a escolha do dono.
--
-- Coexiste com o stock por prato: um artigo simples (ex.: uma lata) continua a
-- poder usar menu_items.track_stock; um prato composto usa a receita. A reserva
-- ao criar o pedido trata dos dois de uma vez, atomicamente.
-- =============================================================

-- ---------- Inventário de ingredientes ----------
create table ingredients (
  id                  uuid primary key default gen_random_uuid(),
  establishment_id    uuid not null references establishments(id) on delete cascade,
  name                text not null,
  stock_qty           integer not null default 0,
  low_stock_threshold integer not null default 5,
  created_at          timestamptz not null default now()
);
create index ingredients_establishment_idx on ingredients(establishment_id);

-- ---------- Receita: quanto de cada ingrediente um prato/extra gasta ----------
-- Cada linha liga UM alvo (prato OU extra) a UM ingrediente, com a quantidade
-- gasta por unidade vendida. O check garante exatamente um alvo.
create table recipe_items (
  id                uuid primary key default gen_random_uuid(),
  establishment_id  uuid not null references establishments(id) on delete cascade,
  ingredient_id     uuid not null references ingredients(id) on delete cascade,
  menu_item_id      uuid references menu_items(id) on delete cascade,
  modifier_id       uuid references modifiers(id) on delete cascade,
  qty               integer not null default 1 check (qty > 0),
  constraint recipe_target_exactly_one check (
    (menu_item_id is not null and modifier_id is null) or
    (menu_item_id is null and modifier_id is not null)
  )
);
create index recipe_items_establishment_idx on recipe_items(establishment_id);
create index recipe_items_menu_item_idx on recipe_items(menu_item_id);
create index recipe_items_modifier_idx on recipe_items(modifier_id);
create index recipe_items_ingredient_idx on recipe_items(ingredient_id);
-- Não repetir o mesmo ingrediente no mesmo alvo (somava-se por engano).
create unique index recipe_items_item_ing_uq
  on recipe_items(menu_item_id, ingredient_id) where menu_item_id is not null;
create unique index recipe_items_mod_ing_uq
  on recipe_items(modifier_id, ingredient_id) where modifier_id is not null;

-- ---------- RLS: legível por todo o staff, editável por owner/manager ----------
-- Mesmo modelo das tabelas de config (ver 0002_rls.sql). O cliente anónimo não
-- toca nestas tabelas: o menu é lido pelo servidor com a service role.
alter table ingredients  enable row level security;
alter table recipe_items enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ingredients','recipe_items']
  loop
    execute format($f$
      create policy %1$s_select on %1$s for select to authenticated
        using (establishment_id = private.auth_establishment_id());
    $f$, t);
    execute format($f$
      create policy %1$s_write on %1$s for all to authenticated
        using (establishment_id = private.auth_establishment_id() and private.auth_is_manager())
        with check (establishment_id = private.auth_establishment_id() and private.auth_is_manager());
    $f$, t);
  end loop;
end$$;

-- ---------- Reserva atómica combinada (pratos + ingredientes) ----------
-- Substitui a reserve_stock(jsonb) de 0012. Agora recebe também os ingredientes
-- agregados do pedido e trata os dois stocks na MESMA transação: tudo ou nada.
--
-- Ordem dos locks: primeiro menu_items, depois ingredients, cada um por id. Como
-- é sempre a mesma ordem entre tabelas e dentro de cada tabela, dois pedidos em
-- simultâneo nunca entram em deadlock.
--
-- Devolve {"ok": true} ou {"ok": false, "item": "<nome do que faltou>"} — o nome
-- pode ser de um prato ou de um ingrediente, para o cliente saber o que retirar.
create or replace function public.reserve_stock(p_items jsonb, p_ingredients jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_failed text;
begin
  -- 1. Locks, sempre menu_items -> ingredients.
  perform 1 from menu_items m
   where m.id in (
     select (e->>'item_id')::uuid
       from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e
   )
   order by m.id for update;

  perform 1 from ingredients g
   where g.id in (
     select (e->>'ingredient_id')::uuid
       from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb)) e
   )
   order by g.id for update;

  -- 2. Verifica pratos seguidos por stock próprio.
  select m.name into v_failed
    from (
      select (e->>'item_id')::uuid item_id, sum((e->>'qty')::int) qty
        from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e group by 1
    ) w
    join menu_items m on m.id = w.item_id
   where m.track_stock and m.stock_qty < w.qty
   limit 1;
  if v_failed is not null then
    return jsonb_build_object('ok', false, 'item', v_failed);
  end if;

  -- 3. Verifica ingredientes.
  select g.name into v_failed
    from (
      select (e->>'ingredient_id')::uuid ing_id, sum((e->>'qty')::int) qty
        from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb)) e group by 1
    ) w
    join ingredients g on g.id = w.ing_id
   where g.stock_qty < w.qty
   limit 1;
  if v_failed is not null then
    return jsonb_build_object('ok', false, 'item', v_failed);
  end if;

  -- 4. Tudo chega: dá baixa dos dois.
  update menu_items m set stock_qty = m.stock_qty - w.qty
    from (
      select (e->>'item_id')::uuid item_id, sum((e->>'qty')::int) qty
        from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e group by 1
    ) w
   where m.id = w.item_id and m.track_stock;

  update ingredients g set stock_qty = g.stock_qty - w.qty
    from (
      select (e->>'ingredient_id')::uuid ing_id, sum((e->>'qty')::int) qty
        from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb)) e group by 1
    ) w
   where g.id = w.ing_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- Compensação: devolve pratos e ingredientes reservados (se a gravação falhar).
create or replace function public.release_stock(p_items jsonb, p_ingredients jsonb)
returns void
language plpgsql
set search_path = public
as $$
begin
  update menu_items m set stock_qty = m.stock_qty + w.qty
    from (
      select (e->>'item_id')::uuid item_id, sum((e->>'qty')::int) qty
        from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e group by 1
    ) w
   where m.id = w.item_id and m.track_stock;

  update ingredients g set stock_qty = g.stock_qty + w.qty
    from (
      select (e->>'ingredient_id')::uuid ing_id, sum((e->>'qty')::int) qty
        from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb)) e group by 1
    ) w
   where g.id = w.ing_id;
end;
$$;

revoke all on function public.reserve_stock(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.release_stock(jsonb, jsonb) from public, anon, authenticated;

-- As versões de um só argumento (0012) deixam de existir: o placeOrder passa a
-- chamar sempre a de dois argumentos.
drop function if exists public.reserve_stock(jsonb);
drop function if exists public.release_stock(jsonb);
