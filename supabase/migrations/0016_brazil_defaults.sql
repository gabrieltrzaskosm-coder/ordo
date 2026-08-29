-- 0016_brazil_defaults.sql — Alinhamento do produto ao mercado brasileiro
-- As migrations anteriores fazem parte do histórico e não são alteradas.
-- Os valores antigos do enum são mantidos para não quebrar dados históricos;
-- a aplicação não os oferece no fluxo brasileiro atual.

alter table establishments
  alter column currency set default 'BRL';

alter type payment_method add value if not exists 'pix';

-- A conversão de estabelecimentos existentes deve ser validada individualmente
-- antes de ser executada pelo operador.
