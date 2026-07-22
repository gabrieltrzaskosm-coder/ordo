-- =============================================================
-- 0009_rename_plan_tiers.sql — Alinhar os nomes dos planos
--
-- O enum nasceu como basic/crm/ai. Os planos comerciais são Basic/Pro/Max.
-- Renomear preserva a coluna e os dados existentes (o default 'basic' mantém-se).
-- =============================================================

alter type plan_tier rename value 'crm' to 'pro';
alter type plan_tier rename value 'ai' to 'max';
