-- =============================================================
-- 0017_management_query_indexes.sql — índices para gestão e previsões
--
-- As páginas de Financeiro, Insights e Ordo IA filtram por estabelecimento e
-- por janela temporal. Os índices anteriores cobriam cada coluna isoladamente,
-- mas não a combinação usada pela aplicação.
-- =============================================================

create index orders_establishment_created_idx
  on orders(establishment_id, created_at);

create index order_items_establishment_created_idx
  on order_items(establishment_id, created_at);

create index order_item_modifiers_establishment_item_idx
  on order_item_modifiers(establishment_id, order_item_id);
