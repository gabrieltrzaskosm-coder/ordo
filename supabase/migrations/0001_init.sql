-- =============================================================
-- 0001_init.sql — Esquema base do MVP (Plano 1)
-- Fonte da verdade do modelo de dados. Dinheiro sempre em cêntimos (integer).
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type plan_tier as enum ('basic', 'crm', 'ai');
create type staff_role as enum ('owner', 'manager', 'kitchen', 'waiter');
create type order_status as enum ('draft', 'placed', 'in_prep', 'ready', 'served', 'cancelled');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type payment_method as enum ('card', 'mbway', 'multibanco', 'cash');
create type waiter_call_status as enum ('open', 'ack', 'resolved');

-- ---------- Tenant / configuração ----------
create table establishments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  plan        plan_tier not null default 'basic',
  vat_number  text,
  currency    text not null default 'EUR',
  created_at  timestamptz not null default now()
);

create table staff (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  auth_user_id     uuid not null unique references auth.users(id) on delete cascade,
  role             staff_role not null default 'waiter',
  display_name     text,
  created_at       timestamptz not null default now()
);
create index staff_establishment_idx on staff(establishment_id);

create table restaurant_tables (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  label            text not null,
  qr_token         text not null unique default encode(gen_random_bytes(16), 'hex'),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);
create index tables_establishment_idx on restaurant_tables(establishment_id);

-- ---------- Menu ----------
create table menu_categories (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  name             text not null,
  sort             int not null default 0,
  created_at       timestamptz not null default now()
);
create index menu_categories_establishment_idx on menu_categories(establishment_id);

create table menu_items (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  category_id      uuid not null references menu_categories(id) on delete cascade,
  name             text not null,
  description      text,
  price_cents      int not null check (price_cents >= 0),
  image_url        text,
  available        boolean not null default true,
  sort             int not null default 0,
  created_at       timestamptz not null default now()
);
create index menu_items_establishment_idx on menu_items(establishment_id);
create index menu_items_category_idx on menu_items(category_id);

create table modifier_groups (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  menu_item_id     uuid not null references menu_items(id) on delete cascade,
  name             text not null,
  min_select       int not null default 0,
  max_select       int not null default 1,
  sort             int not null default 0
);
create index modifier_groups_establishment_idx on modifier_groups(establishment_id);

create table modifiers (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  group_id         uuid not null references modifier_groups(id) on delete cascade,
  name             text not null,
  price_delta_cents int not null default 0,
  available        boolean not null default true,
  sort             int not null default 0
);
create index modifiers_establishment_idx on modifiers(establishment_id);

-- ---------- Pedidos ----------
create table orders (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  table_id         uuid not null references restaurant_tables(id),
  customer_name    text,
  status           order_status not null default 'placed',
  subtotal_cents   int not null default 0,
  tip_cents        int not null default 0,
  total_cents      int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index orders_establishment_idx on orders(establishment_id);
create index orders_table_idx on orders(table_id);
create index orders_status_idx on orders(establishment_id, status);

create table order_items (
  id                 uuid primary key default gen_random_uuid(),
  establishment_id   uuid not null references establishments(id) on delete cascade,
  order_id           uuid not null references orders(id) on delete cascade,
  menu_item_id       uuid references menu_items(id),
  name_snapshot      text not null,
  unit_price_cents   int not null,
  qty                int not null check (qty > 0),
  notes              text,
  created_at         timestamptz not null default now()
);
create index order_items_order_idx on order_items(order_id);
create index order_items_establishment_idx on order_items(establishment_id);

create table order_item_modifiers (
  id                uuid primary key default gen_random_uuid(),
  establishment_id  uuid not null references establishments(id) on delete cascade,
  order_item_id     uuid not null references order_items(id) on delete cascade,
  modifier_id       uuid references modifiers(id),
  name_snapshot     text not null,
  price_delta_cents int not null default 0
);
create index order_item_modifiers_item_idx on order_item_modifiers(order_item_id);

-- ---------- Pagamento / serviço ----------
create table payments (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  order_id         uuid not null references orders(id) on delete cascade,
  provider         text not null,
  provider_ref     text,
  method           payment_method,
  amount_cents     int not null,
  tip_cents        int not null default 0,
  status           payment_status not null default 'pending',
  idempotency_key  text unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index payments_establishment_idx on payments(establishment_id);
create index payments_order_idx on payments(order_id);

create table invoices (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  payment_id       uuid not null references payments(id) on delete cascade,
  provider         text not null,
  at_document_ref  text,
  pdf_url          text,
  created_at       timestamptz not null default now()
);
create index invoices_establishment_idx on invoices(establishment_id);

create table waiter_calls (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  table_id         uuid not null references restaurant_tables(id) on delete cascade,
  status           waiter_call_status not null default 'open',
  note             text,
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz
);
create index waiter_calls_establishment_idx on waiter_calls(establishment_id, status);

-- ---------- Idempotência de webhooks de pagamento ----------
create table webhook_events (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null,
  event_id     text not null,
  payload      jsonb not null,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (provider, event_id)
);
