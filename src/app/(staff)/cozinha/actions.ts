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
}

export async function cancelOrder(orderId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("table_id")
    .maybeSingle();

  // Cancelar um pedido pode deixar os restantes já entregues+pagos → zerar.
  if (data) await maybeCloseTable(data.table_id);

  revalidatePath("/cozinha");
}

/** Pagamento pelo atendente (dinheiro/mesa): marca pago sem passar pela Stripe. */
export async function markPaid(orderId: string) {
  const session = await requireStaff();
  const admin = createAdminClient();

  // Confirma que o pedido é deste estabelecimento antes de usar o admin client.
  const { data: order } = await admin
    .from("orders")
    .select("id, establishment_id, table_id, total_cents, paid_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.establishment_id !== session.establishmentId) return;
  if (order.paid_at) return; // já pago

  const now = new Date().toISOString();
  await admin
    .from("orders")
    .update({ paid_at: now, updated_at: now })
    .eq("id", orderId);

  // Regista o pagamento manual para o financeiro ficar completo.
  await admin.from("payments").insert({
    establishment_id: order.establishment_id,
    order_id: order.id,
    provider: "manual",
    method: "cash",
    amount_cents: order.total_cents,
    status: "paid",
  });

  await maybeCloseTable(order.table_id);
  revalidatePath("/cozinha");
}

export async function resolveWaiterCall(callId: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase
    .from("waiter_calls")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", callId);

  revalidatePath("/cozinha");
}
