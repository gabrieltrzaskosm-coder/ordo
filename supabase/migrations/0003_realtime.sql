-- =============================================================
-- 0003_realtime.sql — Ativar Supabase Realtime na fila da cozinha
--
-- O Realtime só emite eventos para tabelas incluídas na publication
-- `supabase_realtime`. A RLS continua a aplicar-se ao canal: cada membro do
-- staff só recebe eventos do seu próprio estabelecimento.
-- =============================================================

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table waiter_calls;

-- REPLICA IDENTITY FULL: sem isto, eventos de UPDATE/DELETE trazem apenas a
-- chave primária no payload `old`, e a RLS do Realtime não consegue avaliar
-- establishment_id para decidir quem pode receber o evento.
alter table orders replica identity full;
alter table order_items replica identity full;
alter table waiter_calls replica identity full;
