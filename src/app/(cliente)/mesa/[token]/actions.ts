"use server";

// Server Actions do cliente anónimo. Toda a validação de acesso passa pelo
// qr_token (resolveTableSession) e os PREÇOS são recalculados a partir da BD —
// nunca confiar em valores vindos do browser.
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTableSession } from "@/lib/session/table";
import { getOrderableItemIds, type OrderableIds } from "@/lib/menu";
import { loadStockContext } from "@/lib/recipes";
import { prepareOrderLines } from "@/lib/pricing";
import { aggregateIngredientNeeds } from "@/lib/availability";
import { rateLimit } from "@/lib/rate-limit";
import { createOrderCheckout } from "@/lib/stripe/checkout";

const placeOrderSchema = z.object({
  token: z.string().min(1),
  customerName: z.string().trim().min(1).max(80),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        qty: z.number().int().min(1).max(50),
        notes: z.string().max(280).optional(),
        modifierIds: z.array(z.string().uuid()).max(30).optional(),
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
  const limited = rateLimit(`order:${session.tableId}`, 15, 60);
  if (!limited.ok) {
    return {
      ok: false,
      error: "Demasiados pedidos seguidos. Aguarde um momento e tente de novo.",
    };
  }

  const supabase = createAdminClient();

  // Lê da BD tudo o que é preciso para validar e recalcular preços — só deste
  // estabelecimento. O cliente só disse "que artigo" e "que opções"; os valores
  // vêm todos daqui, nunca do browser.
  const ids = [...new Set(items.map((i) => i.menuItemId))];
  const [{ data: dbItems }, { data: dbGroups }, { data: dbMods }] =
    await Promise.all([
      supabase
        .from("menu_items")
        .select("id, name, price_cents, available, track_stock, stock_qty")
        .eq("establishment_id", session.establishmentId)
        .in("id", ids),
      supabase
        .from("modifier_groups")
        .select("id, menu_item_id, min_select, max_select")
        .eq("establishment_id", session.establishmentId)
        .in("menu_item_id", ids),
      supabase
        .from("modifiers")
        .select("id, group_id, name, price_delta_cents, available")
        .eq("establishment_id", session.establishmentId),
    ]);

  // Validação + preço: regra pura, testada em isolamento (ver lib/pricing.ts).
  const priced = prepareOrderLines(
    items,
    new Map(
      (dbItems ?? []).map((i) => [
        i.id,
        {
          id: i.id,
          name: i.name,
          priceCents: i.price_cents,
          available: i.available,
          trackStock: i.track_stock,
          stockQty: i.stock_qty,
        },
      ]),
    ),
    (dbGroups ?? []).map((g) => ({
      id: g.id,
      menuItemId: g.menu_item_id,
      minSelect: g.min_select,
      maxSelect: g.max_select,
    })),
    new Map(
      (dbMods ?? []).map((m) => [
        m.id,
        {
          id: m.id,
          groupId: m.group_id,
          name: m.name,
          priceDeltaCents: m.price_delta_cents,
          available: m.available,
        },
      ]),
    ),
  );
  if (!priced.ok) return { ok: false, error: priced.error };
  const prepared = priced.lines;
  const subtotal = priced.subtotalCents;

  // Total pedido por artigo seguido — para a reserva do stock por prato.
  const byTrackedItem = new Map<string, number>();
  for (const line of items) {
    const it = (dbItems ?? []).find((d) => d.id === line.menuItemId);
    if (it?.track_stock) {
      byTrackedItem.set(
        line.menuItemId,
        (byTrackedItem.get(line.menuItemId) ?? 0) + line.qty,
      );
    }
  }

  // ---- Reserva de stock ANTES de criar o pedido ----
  // É aqui que se decide quem fica com a última unidade. A reserve_stock()
  // bloqueia as linhas, verifica e dá baixa na mesma transação, por isso dois
  // pedidos simultâneos do último artigo não passam os dois. Reservar antes de
  // gravar evita ter de apagar um pedido já criado.
  const reserveItems = [...byTrackedItem.entries()].map(([item_id, qty]) => ({
    item_id,
    qty,
  }));

  // Ingredientes gastos pelo pedido: receita do prato + receita de cada extra
  // escolhido, tudo × quantidade da linha e agregado por ingrediente (regra pura
  // — a mesma que o alerta de consumo do plano Max usa do outro lado).
  const { itemNeeds, modifierNeeds } = await loadStockContext(
    session.establishmentId,
  );
  const ingredientNeed = aggregateIngredientNeeds(
    prepared.map((l) => ({
      itemId: l.itemId,
      qty: l.qty,
      modifierIds: l.modifiers.map((m) => m.id),
    })),
    itemNeeds,
    modifierNeeds,
  );
  const reserveIngredients = [...ingredientNeed.entries()].map(
    ([ingredient_id, qty]) => ({ ingredient_id, qty }),
  );

  const needsReserve = reserveItems.length > 0 || reserveIngredients.length > 0;

  if (needsReserve) {
    const { data: reserved, error: reserveErr } = await supabase.rpc(
      "reserve_stock",
      { p_items: reserveItems, p_ingredients: reserveIngredients },
    );
    if (reserveErr) {
      console.error("[stock] reserva falhou:", reserveErr.message);
      return { ok: false, error: "Não foi possível confirmar o stock." };
    }
    const r = reserved as { ok: boolean; item?: string } | null;
    if (!r?.ok) {
      // Alguém levou a última unidade primeiro — pode ser o prato ou um
      // ingrediente (ex.: acabou o pão que este hambúrguer usa).
      return {
        ok: false,
        error: r?.item
          ? `Sem stock de ${r.item} neste momento. Ajuste o pedido para continuar.`
          : "Um dos artigos esgotou agora mesmo.",
      };
    }
  }

  // A partir daqui o stock já está reservado: se algo falhar, tem de ser devolvido.
  const releaseReserved = async () => {
    if (!needsReserve) return;
    const { error } = await supabase.rpc("release_stock", {
      p_items: reserveItems,
      p_ingredients: reserveIngredients,
    });
    if (error) {
      console.error(
        "[stock] devolução falhou:",
        error.message,
        reserveItems,
        reserveIngredients,
      );
    }
  };

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      establishment_id: session.establishmentId,
      table_id: session.tableId,
      customer_name: customerName,
      status: "placed",
      subtotal_cents: subtotal,
      total_cents: subtotal,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    await releaseReserved();
    return { ok: false, error: "Falha ao criar o pedido." };
  }

  // Insere cada linha e as suas opções (uma a uma para obter o id do item).
  for (const l of prepared) {
    const { data: oi, error: oiErr } = await supabase
      .from("order_items")
      .insert({
        establishment_id: session.establishmentId,
        order_id: order.id,
        menu_item_id: l.itemId,
        name_snapshot: l.name,
        unit_price_cents: l.unitPriceCents,
        qty: l.qty,
        notes: l.notes,
      })
      .select("id")
      .single();
    if (oiErr || !oi) {
      await releaseReserved();
      return { ok: false, error: "Falha ao registar os itens." };
    }

    if (l.modifiers.length > 0) {
      const rows = l.modifiers.map((m) => ({
        establishment_id: session.establishmentId,
        order_item_id: oi.id,
        modifier_id: m.id,
        name_snapshot: m.name,
        price_delta_cents: m.delta,
      }));
      await supabase.from("order_item_modifiers").insert(rows);
    }
  }

  // O stock já foi dado em baixa na reserva, acima.
  return { ok: true, orderId: order.id };
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

const paySchema = z.object({
  token: z.string().min(1),
  orderId: z.string().uuid(),
  tipCents: z.number().int().min(0),
});

export type PayResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function payForOrder(input: unknown): Promise<PayResult> {
  const parsed = paySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };
  const { token, orderId, tipCents } = parsed.data;
  return createOrderCheckout(token, orderId, tipCents);
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

  // Chamar o atendente é um clique; um humano não o faz 5x por minuto. Aperta
  // para não deixar spammar a fila de chamadas da cozinha.
  const limited = rateLimit(`waiter:${session.tableId}`, 5, 60);
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
