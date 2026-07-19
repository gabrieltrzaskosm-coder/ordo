-- =============================================================
-- 0006_order_closed_at.sql — Fecho da sessão de mesa
--
-- Um pedido está "ativo na mesa" enquanto closed_at IS NULL e status != cancelled.
-- A mesa zera-se automaticamente quando TODOS os pedidos ativos estão entregues
-- (status = 'served') E pagos (paid_at IS NOT NULL) — seja pagamento pela app
-- (webhook) ou pelo atendente (dinheiro). Ao zerar, closed_at é preenchido em
-- todos, o acompanhamento do cliente esvazia, e a mesa fica livre.
-- =============================================================

alter table orders add column closed_at timestamptz;
create index orders_table_active_idx on orders(table_id) where closed_at is null;
