// Criação de um pedido para uma mesa. Núcleo partilhado entre o cliente
// (placeOrder, via qr_token) e o atendente (createStaffOrder). RECALCULA os
// preços a partir da BD (nunca confia no browser), reserva o stock de forma
// atómica e grava pedido + linhas + opções. A validação de ACESSO (quem pode
// pedir para esta mesa) é de quem chama — aqui já se recebe o establishment e a
// mesa confirmados.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { prepareOrderLines, type RequestedLine } from "@/lib/pricing";
import { toOrderItemsPayload } from "@/lib/orders/payload";

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

  // A reserva, o pedido, as linhas e os extras têm de nascer ou falhar juntos.
  // A RPC usa uma única transação no PostgreSQL; compensação via chamadas
  // separadas deixava janelas para pedido/estoque divergirem em falhas parciais.
  const { data, error } = await supabase.rpc("create_order_with_stock", {
    p_establishment_id: establishmentId,
    p_table_id: tableId,
    p_customer_name: customerName,
    p_subtotal_cents: subtotal,
    p_order_items: toOrderItemsPayload(prepared),
  });

  if (error) {
    console.error("[order] transação falhou:", error.message);
    return { ok: false, error: "Não foi possível criar o pedido." };
  }

  const result = data as { ok?: boolean; order_id?: string; item?: string } | null;
  if (!result?.ok || !result.order_id) {
    return {
      ok: false,
      error: result?.item
        ? `Sem stock de ${result.item} neste momento. Ajuste o pedido para continuar.`
        : "Não foi possível confirmar o pedido.",
    };
  }

  return { ok: true, orderId: result.order_id };
}
