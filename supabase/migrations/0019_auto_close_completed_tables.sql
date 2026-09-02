-- =============================================================
-- 0019_auto_close_completed_tables.sql
--
-- Garante o fechamento da mesa no próprio banco. A regra não depende de qual
-- tela, Server Action ou integração alterou o pedido: uma mudança de entrega,
-- pagamento ou cancelamento sempre reavalia a mesa sob o lock já usado pela
-- função close_table_if_complete.
--
-- Rollback (em migration posterior, se necessário): DROP TRIGGER e DROP
-- FUNCTION abaixo. Esta migration não altera nem reescreve dados existentes.
-- =============================================================

create or replace function public.close_table_after_order_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- NEW.table_id vem da própria linha que acabou de ser alterada. A função
  -- chamada bloqueia a mesa e só fecha se TODOS os pedidos ativos estiverem
  -- delivered (served) e pagos; pedidos cancelados ficam fora da condição.
  perform public.close_table_if_complete(new.table_id);
  return new;
end;
$$;

drop trigger if exists close_table_after_order_completion on public.orders;

create trigger close_table_after_order_completion
after update of status, paid_at on public.orders
for each row
when (
  old.status is distinct from new.status
  or old.paid_at is distinct from new.paid_at
)
execute function public.close_table_after_order_completion();

-- É uma função de trigger interna: nenhum papel da API a invoca diretamente.
revoke all on function public.close_table_after_order_completion() from public, anon, authenticated;
