-- =============================================================
-- 0010_stock.sql — Gestão de stock (plano Max)
--
-- Stock por artigo, opt-in (track_stock). A disponibilidade efetiva no menu do
-- cliente passa a considerar o stock: available AND (not track_stock OR
-- stock_qty > 0). Assim, a zero fica "esgotado" automaticamente sem mexer no
-- interruptor manual `available`, e volta a aparecer ao repor stock.
--
-- A baixa é feita no servidor ao criar o pedido (ver placeOrder). Restaurantes
-- sem o plano Max nunca ligam track_stock, por isso a lógica é no-op para eles.
-- =============================================================

alter table menu_items
  add column track_stock         boolean not null default false,
  add column stock_qty           integer not null default 0,
  add column low_stock_threshold integer not null default 5;
