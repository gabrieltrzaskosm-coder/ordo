"use server";

// Server Actions do cliente anónimo. Toda a validação de acesso passa pelo
// qr_token (resolveTableSession) e os PREÇOS são recalculados a partir da BD —
// nunca confiar em valores vindos do browser.
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTableSession } from "@/lib/session/table";
import { getOrderableItemIds, type OrderableIds } from "@/lib/menu";
import { createOrder } from "@/lib/orders/create";
import { checkRateLimit } from "@/lib/rate-limit";

const placeOrderSchema = z.object({
  token: z.string().min(1),
  customerName: z.string().trim().min(1).max(80),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        qty: z.number().int().min(1).max(50),
        notes: z.string().max(280).optional(),
        // Ids repetidos = quantidade do extra ("2× bacon" = [bacon, bacon]).
        modifierIds: z.array(z.string().uuid()).max(60).optional(),
      }),
    )
    .min(1),
});

export type ActionResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function placeOrder(input: unknown): Promise<ActionResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };
  const { token, customerName, items } = parsed.data;

  const session = await resolveTableSession(token);
  if (!session) return { ok: false, error: "Mesa não encontrada." };

  // Trava o abuso: uma mesa real não faz dezenas de pedidos por minuto. Generoso
  // para o uso normal (várias pessoas na mesma mesa), apertado para um script.
  const limited = await checkRateLimit(`order:${session.tableId}`, 15, 60);
  if (!limited.ok) {
    return {
      ok: false,
      error: "Demasiados pedidos seguidos. Aguarde um momento e tente de novo.",
    };
  }

  // Núcleo partilhado com o atendente (lib/orders/create): valida, recalcula
  // preços, reserva stock e grava. O cliente só acrescenta o qr_token + rate limit.
  return createOrder(
    session.establishmentId,
    session.tableId,
    customerName,
    items,
  );
}

/**
 * Ids dos artigos E extras que ainda se podem pedir. O menu do cliente consulta
 * isto em polling para fazer desaparecer o que esgotou enquanto ele estava no
 * ecrã — seja o prato ou um ingrediente que um extra usa.
 */
export async function getOrderableItems(token: string): Promise<OrderableIds> {
  const session = await resolveTableSession(token);
  if (!session) return { items: [], modifiers: [] };
  return getOrderableItemIds(session.establishmentId);
}

export type TrackedOrder = {
  id: string;
  customerName: string | null;
  status: "placed" | "in_prep" | "ready" | "served";
  paid: boolean;
  items: { name: string; qty: number }[];
};

// Estado dos pedidos ativos da mesa, para o cliente acompanhar (sem login).
// Consultado por polling. Validado pelo qr_token; só devolve o que é da mesa.
export async function getTableStatus(token: string): Promise<TrackedOrder[]> {
  const session = await resolveTableSession(token);
  if (!session) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("id, customer_name, status, paid_at, order_items(name_snapshot, qty)")
    .eq("table_id", session.tableId)
    .is("closed_at", null)
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });

  return (data ?? []).map((o) => ({
    id: o.id,
    customerName: o.customer_name,
    status: o.status as TrackedOrder["status"],
    paid: o.paid_at !== null,
    items: (o.order_items ?? []).map((i) => ({
      name: i.name_snapshot,
      qty: i.qty,
    })),
  }));
}

export async function callWaiter(token: string): Promise<ActionResult> {
  const session = await resolveTableSession(token);
  if (!session) return { ok: false, error: "Mesa não encontrada." };

  // Chamar o garçom é um clique; um humano não o faz 5x por minuto. Aperta
  // para não deixar spammar a fila de chamadas da cozinha.
  const limited = await checkRateLimit(`waiter:${session.tableId}`, 5, 60);
  if (!limited.ok) {
    return { ok: false, error: "Atendente já chamado. Aguarde um momento." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("waiter_calls").insert({
    establishment_id: session.establishmentId,
    table_id: session.tableId,
    status: "open",
  });
  if (error) return { ok: false, error: "Falha ao chamar o atendente." };
  return { ok: true, orderId: "" };
}
