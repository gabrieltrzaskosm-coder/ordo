// Criação de um pedido para uma mesa. Núcleo partilhado entre o cliente
// (placeOrder, via qr_token) e o atendente (createStaffOrder). RECALCULA os
// preços a partir da BD (nunca confia no browser), reserva o stock de forma
// atómica e grava pedido + linhas + opções. A validação de ACESSO (quem pode
// pedir para esta mesa) é de quem chama — aqui já se recebe o establishment e a
// mesa confirmados.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadStockContext } from "@/lib/recipes";
import { prepareOrderLines, type RequestedLine } from "@/lib/pricing";
import { aggregateIngredientNeeds } from "@/lib/availability";

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createOrder(
  establishmentId: string,
  tableId: string,
  customerName: string,
  items: RequestedLine[],
): Promise<CreateOrderResult> {
  const supabase = createAdminClient();

  // Lê da BD tudo o que é preciso para validar e recalcular preços — só deste
  // estabelecimento. Quem chama só disse "que artigo" e "que opções"; os valores
  // vêm todos daqui.
  const ids = [...new Set(items.map((i) => i.menuItemId))];
  const [{ data: dbItems }, { data: dbLinks }, { data: dbGroups }, { data: dbMods }] =
    await Promise.all([
      supabase
        .from("menu_items")
        .select("id, name, price_cents, available, track_stock, stock_qty")
        .eq("establishment_id", establishmentId)
        .in("id", ids),
      supabase
        .from("item_modifier_groups")
        .select("menu_item_id, group_id")
        .eq("establishment_id", establishmentId)
        .in("menu_item_id", ids),
      supabase
        .from("modifier_groups")
        .select("id, min_select, max_select")
        .eq("establishment_id", establishmentId),
      supabase
        .from("modifiers")
        .select("id, group_id, name, price_delta_cents, available")
        .eq("establishment_id", establishmentId),
    ]);

  // Grupos ligados a estes pratos: um PricedGroup por ligação (prato × grupo),
  // para um grupo reutilizado valer em cada prato onde está.
  const groupMeta = new Map((dbGroups ?? []).map((g) => [g.id, g]));
  const pricedGroups = (dbLinks ?? []).flatMap((l) => {
    const g = groupMeta.get(l.group_id);
    return g
      ? [
          {
            id: g.id,
            menuItemId: l.menu_item_id,
            minSelect: g.min_select,
            maxSelect: g.max_select,
          },
        ]
      : [];
  });

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
    pricedGroups,
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
  const reserveItems = [...byTrackedItem.entries()].map(([item_id, qty]) => ({
    item_id,
    qty,
  }));

  const { itemNeeds, modifierNeeds } = await loadStockContext(establishmentId);
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
      return {
        ok: false,
        error: r?.item
          ? `Sem stock de ${r.item} neste momento. Ajuste o pedido para continuar.`
          : "Um dos artigos esgotou agora mesmo.",
      };
    }
  }

  // A partir daqui o stock já está reservado: se algo falhar, devolve-se.
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
      establishment_id: establishmentId,
      table_id: tableId,
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
        establishment_id: establishmentId,
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
        establishment_id: establishmentId,
        order_item_id: oi.id,
        modifier_id: m.id,
        name_snapshot: m.name,
        price_delta_cents: m.delta,
      }));
      await supabase.from("order_item_modifiers").insert(rows);
    }
  }

  return { ok: true, orderId: order.id };
}
