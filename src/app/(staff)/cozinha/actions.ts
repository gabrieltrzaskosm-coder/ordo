"use server";

// Actions da cozinha. A maioria usa o cliente autenticado (RLS garante que o
// staff só toca no seu estabelecimento). markPaid e o fecho de mesa usam o admin
// client porque tocam em `payments` (RLS: só owner/manager) e fecham vários
// pedidos — mas SEMPRE confirmando o establishment da sessão.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { maybeCloseTable } from "@/lib/orders/close";
import type { Database } from "@/lib/supabase/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "in_prep",
  in_prep: "ready",
  ready: "served",
};

export async function advanceOrder(orderId: string, current: OrderStatus) {
  await requireStaff();
  const next = NEXT_STATUS[current];
  if (!next) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("table_id")
    .maybeSingle();

  // Marcar como entregue pode satisfazer a condição de zerar a mesa.
  if (data && next === "served") await maybeCloseTable(data.table_id);

  revalidatePath("/cozinha");
  revalidatePath("/atendimento");
}

export async function cancelOrder(orderId: string): Promise<boolean> {
  const session = await requireStaff();
  const admin = createAdminClient();

  // Cancela e devolve exatamente a reserva gravada no pedido na mesma
  // transação. Um segundo pedido de cancelamento só vê o estado já cancelado e
  // nunca devolve o stock duas vezes.
  const { data, error } = await admin.rpc("cancel_order_and_release_stock", {
    p_establishment_id: session.establishmentId,
    p_order_id: orderId,
  });
  const result = data as { ok?: boolean } | null;
  if (error || !result?.ok) {
    console.error("[order] cancelamento falhou:", error?.message ?? result);
    return false;
  }

  revalidatePath("/cozinha");
  revalidatePath("/atendimento");
  return true;
}

/** Pagamento pelo garçom (dinheiro/mesa): marca o pedido como pago. */
export async function markPaid(orderId: string): Promise<boolean> {
  const session = await requireStaff();
  const admin = createAdminClient();

  // O lock do pedido e a chave de idempotência vivem no PostgreSQL. Assim dois
  // cliques concorrentes produzem no máximo um pagamento e um paid_at.
  const { data, error } = await admin.rpc("mark_order_paid", {
    p_establishment_id: session.establishmentId,
    p_order_id: orderId,
  });
  const result = data as { ok?: boolean } | null;
  if (error || !result?.ok) {
    console.error("[payment] confirmação falhou:", error?.message ?? result);
    return false;
  }

  revalidatePath("/cozinha");
  revalidatePath("/atendimento");
  return true;
}

export async function resolveWaiterCall(callId: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase
    .from("waiter_calls")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", callId);

  revalidatePath("/cozinha");
  revalidatePath("/atendimento");
}
