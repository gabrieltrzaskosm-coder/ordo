// Fecho automático da mesa. Regra: quando TODOS os pedidos ativos de uma mesa
// (closed_at IS NULL, status != cancelled) estão entregues (served) E pagos
// (paid_at IS NOT NULL), fecha-os todos (closed_at = now). Isto liberta a mesa e
// esvazia o acompanhamento do cliente.
//
// Chamado após qualquer evento que possa satisfazer a condição: pagamento pela
// app (webhook), pagamento pelo garçom (markPaid), ou marcar como entregue.
// Usa o admin client (o webhook não tem sessão; a lógica é idempotente).
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function maybeCloseTable(tableId: string): Promise<boolean> {
  const admin = createAdminClient();
  // A função bloqueia a mesa antes de avaliar/fechar os pedidos. Sem esse lock,
  // um pedido novo podia entrar entre a leitura e o UPDATE e ser fechado por
  // engano junto com os pedidos já concluídos.
  const { data, error } = await admin.rpc("close_table_if_complete", {
    p_table_id: tableId,
  });
  return !error && data === true;
}
