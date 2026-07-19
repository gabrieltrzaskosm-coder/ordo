-- =============================================================
-- 0004_stripe_connect.sql — Stripe Connect
--
-- O pagamento do cliente vai DIRETO ao restaurante (destination charge na conta
-- Connect do restaurante). A plataforma nunca detém o dinheiro. Cada
-- estabelecimento liga a sua própria conta Stripe (Express).
-- =============================================================

alter table establishments
  add column stripe_account_id text unique,
  add column stripe_charges_enabled boolean not null default false;

alter table payments
  add column stripe_checkout_session_id text;
create index payments_checkout_session_idx on payments(stripe_checkout_session_id);
