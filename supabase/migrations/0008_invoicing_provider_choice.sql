-- =============================================================
-- 0008_invoicing_provider_choice.sql — Escolha de fornecedor de faturação
--
-- A faturação passa a ser uma ESCOLHA por restaurante:
--   'vendus'        -> a app emite via Vendus (api_key obrigatória)
--   'external'      -> o restaurante fatura por fora (POS próprio, contabilista,
--                      outro software). A app NÃO emite. Sem credenciais.
--   'moloni'/'invoicexpress' -> futuros adaptadores (Fase 2).
--
-- Por isso a api_key deixa de ser obrigatória: o fornecedor 'external' não a tem.
-- Distinção importante: NÃO ter linha nenhuma = "ainda não decidiu" (a gestão
-- convida a escolher); linha com provider='external' = "decidiu faturar por fora"
-- (a gestão deixa de insistir).
-- =============================================================

alter table establishment_invoicing
  alter column api_key drop not null;
