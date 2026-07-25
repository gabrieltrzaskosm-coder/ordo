-- =============================================================
-- 0014_reusable_modifier_groups.sql — Extras reutilizáveis entre pratos
--
-- Antes: um grupo de opções pertencia a UM prato (modifier_groups.menu_item_id).
-- Para ter "Extras" em 3 hambúrgueres, criavam-se 3 grupos iguais.
--
-- Agora: o grupo é uma entidade reutilizável do estabelecimento e liga-se a N
-- pratos por uma tabela de ligação (item_modifier_groups). Editar o grupo (ou
-- as suas opções) reflete-se em todos os pratos que o usam.
--
-- RETROCOMPATÍVEL: o menu_item_id dos grupos existentes NÃO é apagado, e as
-- ligações antigas são recriadas na tabela nova (backfill). Assim o código já
-- em produção continua a funcionar até ao deploy do código novo.
-- =============================================================

-- 1. O grupo deixa de precisar de pertencer a um prato (novos grupos: null).
alter table modifier_groups alter column menu_item_id drop not null;

-- 2. Ligação prato <-> grupo (um grupo pode servir vários pratos).
create table item_modifier_groups (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  menu_item_id     uuid not null references menu_items(id) on delete cascade,
  group_id         uuid not null references modifier_groups(id) on delete cascade,
  sort             int not null default 0,
  unique (menu_item_id, group_id)
);
create index item_modifier_groups_item_idx on item_modifier_groups(menu_item_id);
create index item_modifier_groups_group_idx on item_modifier_groups(group_id);

-- 3. Backfill: cada grupo existente fica ligado ao prato onde já estava.
insert into item_modifier_groups (establishment_id, menu_item_id, group_id, sort)
select establishment_id, menu_item_id, id, sort
  from modifier_groups
 where menu_item_id is not null;

-- 4. RLS: mesmo padrão dos outros dados do estabelecimento — leitura para o
--    estabelecimento, escrita só para manager. (private.* está fora da API.)
alter table item_modifier_groups enable row level security;

create policy item_modifier_groups_select on item_modifier_groups
  for select to authenticated
  using (establishment_id = private.auth_establishment_id());

create policy item_modifier_groups_write on item_modifier_groups
  for all to authenticated
  using (
    establishment_id = private.auth_establishment_id()
    and private.auth_is_manager()
  )
  with check (
    establishment_id = private.auth_establishment_id()
    and private.auth_is_manager()
  );
