-- =============================================================
-- 0005_order_paid_at.sql — Carimbo de pagamento no pedido
--
-- Denormaliza o estado "pago" para `orders`, preenchido pelo webhook Stripe.
-- Motivo: a cozinha/atendimento lê `orders` mas NÃO tem acesso a `payments`
-- (RLS restringe a owner/manager). Assim o staff vê "Pago" sem ver valores, e a
-- subscrição Realtime de `orders` atualiza o selo em tempo real.
-- =============================================================

alter table orders add column paid_at timestamptz;
