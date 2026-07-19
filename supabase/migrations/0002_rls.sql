-- =============================================================
-- 0002_rls.sql — Row Level Security (isolamento multi-tenant)
--
-- Modelo de acesso:
--  * STAFF (Supabase Auth): acede apenas ao SEU estabelecimento, via helpers
--    private.auth_establishment_id() / private.auth_role(). Financeiro
--    (payments/invoices) e edição de menu restritos a owner/manager.
--  * CLIENTE (anónimo, sem login): NÃO tem acesso direto às tabelas. Todas as
--    operações do cliente passam pelo servidor Next.js (service role), que
--    valida o qr_token e restringe ao estabelecimento/mesa resolvidos.
--    Por isso NÃO criamos políticas para o papel `anon`: o default (deny) vale.
--
-- NOTA IMPORTANTE — porquê o schema `private`:
-- Funções SECURITY DEFINER colocadas em `public` são expostas pelo PostgREST em
-- /rest/v1/rpc/<nome> e ficam chamáveis por anon/authenticated. Como só servem
-- de suporte às políticas de RLS, vivem em `private`, que não está na lista de
-- schemas expostos pela API. As políticas continuam a chamá-las normalmente.
-- (Detetado pelo linter de segurança do Supabase: lint 0028/0029.)
-- =============================================================

create schema if not exists private;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

-- ---------- Helpers (SECURITY DEFINER para poderem ler a tabela staff) ----------
create or replace function private.auth_establishment_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select establishment_id from public.staff where auth_user_id = auth.uid() limit 1;
$$;

create or replace function private.auth_role()
returns public.staff_role
language sql stable security definer set search_path = public as $$
  select role from public.staff where auth_user_id = auth.uid() limit 1;
$$;

create or replace function private.auth_is_manager()
returns boolean
language sql stable security definer set search_path = public as $$
  select private.auth_role() in ('owner', 'manager');
$$;

revoke all on function private.auth_establishment_id() from public, anon;
revoke all on function private.auth_role() from public, anon;
revoke all on function private.auth_is_manager() from public, anon;
grant execute on function private.auth_establishment_id() to authenticated;
grant execute on function private.auth_role() to authenticated;
grant execute on function private.auth_is_manager() to authenticated;

-- ---------- Ativar RLS em todas as tabelas ----------
alter table establishments        enable row level security;
alter table staff                 enable row level security;
alter table restaurant_tables     enable row level security;
alter table menu_categories       enable row level security;
alter table menu_items            enable row level security;
alter table modifier_groups       enable row level security;
alter table modifiers             enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table order_item_modifiers  enable row level security;
alter table payments              enable row level security;
alter table invoices              enable row level security;
alter table waiter_calls          enable row level security;
alter table webhook_events        enable row level security;

-- ---------- establishments ----------
create policy est_select on establishments for select to authenticated
  using (id = private.auth_establishment_id());
create policy est_update on establishments for update to authenticated
  using (id = private.auth_establishment_id() and private.auth_is_manager())
  with check (id = private.auth_establishment_id() and private.auth_is_manager());

-- ---------- staff ----------
create policy staff_select on staff for select to authenticated
  using (establishment_id = private.auth_establishment_id());
create policy staff_write on staff for all to authenticated
  using (establishment_id = private.auth_establishment_id() and private.auth_is_manager())
  with check (establishment_id = private.auth_establishment_id() and private.auth_is_manager());

-- ---------- Config: legível por todo o staff, editável por owner/manager ----------
do $$
declare t text;
begin
  foreach t in array array[
    'restaurant_tables','menu_categories','menu_items','modifier_groups','modifiers'
  ]
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

-- ---------- orders / itens / chamadas de atendente ----------
-- Todo o staff do estabelecimento pode ler e escrever (a cozinha muda o status,
-- o empregado cria pedidos). O cliente cria via servidor (service role).
do $$
declare t text;
begin
  foreach t in array array['orders','order_items','order_item_modifiers','waiter_calls']
  loop
    execute format($f$
      create policy %1$s_all on %1$s for all to authenticated
        using (establishment_id = private.auth_establishment_id())
        with check (establishment_id = private.auth_establishment_id());
    $f$, t);
  end loop;
end$$;

-- ---------- payments / invoices (financeiro: só owner/manager) ----------
do $$
declare t text;
begin
  foreach t in array array['payments','invoices']
  loop
    execute format($f$
      create policy %1$s_read on %1$s for select to authenticated
        using (establishment_id = private.auth_establishment_id() and private.auth_is_manager());
    $f$, t);
    execute format($f$
      create policy %1$s_write on %1$s for all to authenticated
        using (establishment_id = private.auth_establishment_id() and private.auth_is_manager())
        with check (establishment_id = private.auth_establishment_id() and private.auth_is_manager());
    $f$, t);
  end loop;
end$$;

-- ---------- webhook_events ----------
-- Intencionalmente SEM políticas: RLS ativo + zero políticas = deny para
-- anon/authenticated. Só acessível pelo service role no servidor.
