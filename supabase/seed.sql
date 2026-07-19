-- Seed de demonstração para desenvolvimento local (supabase db reset).
-- Não cria staff (precisa de auth.users — criado via signup). Cria um
-- estabelecimento demo com mesas e menu para testar o fluxo do cliente.

with est as (
  insert into establishments (name, slug, plan, vat_number, currency)
  values ('Lancheria Demo', 'demo', 'basic', 'PT999999990', 'EUR')
  returning id
),
t as (
  insert into restaurant_tables (establishment_id, label, qr_token)
  select id, 'Mesa 1', 'demo-mesa-1' from est
  union all
  select id, 'Mesa 2', 'demo-mesa-2' from est
  returning establishment_id
),
cat as (
  insert into menu_categories (establishment_id, name, sort)
  select id, 'Hambúrgueres', 1 from est
  union all
  select id, 'Bebidas', 2 from est
  returning id, establishment_id, name
)
insert into menu_items (establishment_id, category_id, name, description, price_cents, sort)
select c.establishment_id, c.id, v.name, v.descr, v.price, v.sort
from cat c
join (values
  ('Hambúrgueres', 'Cheeseburger', 'Carne, queijo, pickles', 850, 1),
  ('Hambúrgueres', 'Bacon burger', 'Carne, bacon, cheddar', 990, 2),
  ('Bebidas', 'Água 50cl', 'Sem gás', 150, 1),
  ('Bebidas', 'Refrigerante', 'Lata 33cl', 200, 2)
) as v(cat_name, name, descr, price, sort) on v.cat_name = c.name;
