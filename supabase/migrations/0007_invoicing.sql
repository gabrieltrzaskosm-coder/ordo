-- =============================================================
-- 0007_invoicing.sql — Faturação certificada (AT) via Vendus
--
-- Cada restaurante é o vendedor (o dinheiro vai-lhe direto por Stripe Connect),
-- por isso emite os SEUS documentos com a SUA conta Vendus. A plataforma nunca
-- emite em nome do restaurante. Ver product-model.
--
-- O IVA guarda-se como CÓDIGO fiscal por artigo (não percentagem): a taxa real
-- depende da região (Continente/Madeira/Açores) e o fornecedor resolve pelo
-- código. NOR=normal(23%), INT=intermédia(13%), RED=reduzida(6%), ISE=isento.
-- =============================================================

-- ---------- IVA por artigo ----------
create type vat_code as enum ('NOR', 'INT', 'RED', 'ISE');

alter table menu_items
  add column vat_code vat_code not null default 'NOR';

-- ---------- Configuração de faturação por estabelecimento ----------
-- Contém a API key do Vendus — um SEGREDO. A tabela tem RLS ATIVA e NENHUMA
-- política: default-deny. Só o service role (admin client, no servidor) lê/
-- escreve. O browser do staff nunca lê esta tabela; a gestão vê apenas um
-- estado "configurado sim/não" devolvido por uma server action.
create table establishment_invoicing (
  establishment_id uuid primary key references establishments(id) on delete cascade,
  provider         text not null default 'vendus',
  api_key          text not null,
  register_id      text,
  mode             text not null default 'tests',  -- 'tests' | 'normal'
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table establishment_invoicing enable row level security;
-- (sem policies: acesso exclusivo do service role)

-- ---------- Reforço da tabela invoices ----------
-- Um pagamento => no máximo uma fatura emitida (idempotência sob corrida).
-- Guardamos também tentativas falhadas (status='failed') para reemitir/mostrar.
alter table invoices
  add column status       text not null default 'issued',  -- 'issued' | 'failed'
  add column number       text,
  add column amount_cents int,
  add column error        text;

-- Só pode haver UMA fatura emitida por pagamento (falhas não bloqueiam retry).
create unique index invoices_payment_issued_uidx
  on invoices(payment_id)
  where status = 'issued';
