// Fecho automático da mesa. Regra: quando TODOS os pedidos ativos de uma mesa
// (closed_at IS NULL, status != cancelled) estão entregues (served) E pagos
// (paid_at IS NOT NULL), fecha-os todos (closed_at = now). Isto liberta a mesa e
// esvazia o acompanhamento do cliente.
//
// Chamado após qualquer evento que possa satisfazer a condição: pagamento pela
// app (webhook), pagamento pelo atendente (markPaid), ou marcar como entregue.
// Usa o admin client (o webhook não tem sessão; a lógica é idempotente).
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function maybeCloseTable(tableId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: active } = await admin
    .from("orders")
    .select("id, status, paid_at")
    .eq("table_id", tableId)
    .is("closed_at", null)
    .neq("status", "cancelled");

  if (!active || active.length === 0) return false;

  const allDone = active.every(
    (o) => o.status === "served" && o.paid_at !== null,
  );
  if (!allDone) return false;

  const now = new Date().toISOString();
  await admin
    .from("orders")
    .update({ closed_at: now })
    .eq("table_id", tableId)
    .is("closed_at", null)
    .neq("status", "cancelled");

  return true;
}
