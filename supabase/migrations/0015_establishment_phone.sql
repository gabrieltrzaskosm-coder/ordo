-- =============================================================
-- 0015_establishment_phone.sql — Telefone/WhatsApp do restaurante
-- Capturado no cadastro do dono (fluxo mais completo, pt-BR). É o canal de
-- contato principal do onboarding manual. Nullable: os estabelecimentos já
-- existentes ficam sem telefone até preencherem.
-- =============================================================

alter table establishments add column if not exists phone text;

comment on column establishments.phone is 'Telefone/WhatsApp de contato do restaurante (formato livre).';
