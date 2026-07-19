"use server";

// Server Actions do cliente anónimo. Toda a validação de acesso passa pelo
// qr_token (resolveTableSession) e os PREÇOS são recalculados a partir da BD —
// nunca confiar em valores vindos do browser.
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTableSession } from "@/lib/session/table";
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

  const supabase = createAdminClient();

  // Recalcula tudo a partir da BD, só itens deste estabelecimento e disponíveis.
  const ids = [...new Set(items.map((i) => i.menuItemId))];
  const { data: dbItems } = await supabase
    .from("menu_items")
    .select("id, name, price_cents, available")
    .eq("establishment_id", session.establishmentId)
    .in("id", ids);

  const byId = new Map((dbItems ?? []).map((i) => [i.id, i]));
  for (const line of items) {
    const it = byId.get(line.menuItemId);
    if (!it || !it.available) return { ok: false, error: "Item indisponível." };
  }

  // Grupos e opções destes itens — para validar as escolhas e obter os preços
  // extra a partir da BD (nunca do browser).
  const { data: dbGroups } = await supabase
    .from("modifier_groups")
    .select("id, menu_item_id, min_select, max_select")
    .eq("establishment_id", session.establishmentId)
    .in("menu_item_id", ids);
  const { data: dbMods } = await supabase
    .from("modifiers")
    .select("id, group_id, name, price_delta_cents, available")
    .eq("establishment_id", session.establishmentId);

  const modById = new Map((dbMods ?? []).map((m) => [m.id, m]));
  const groupById = new Map((dbGroups ?? []).map((g) => [g.id, g]));
  const groupsOfItem = new Map<string, string[]>();
  for (const g of dbGroups ?? []) {
    const l = groupsOfItem.get(g.menu_item_id) ?? [];
    l.push(g.id);
    groupsOfItem.set(g.menu_item_id, l);
  }

  // Valida cada linha e calcula o preço unitário (base + extras das opções).
  type PreparedLine = {
    itemId: string;
    name: string;
    unitPriceCents: number;
    qty: number;
    notes: string | null;
    modifiers: { id: string; name: string; delta: number }[];
  };
  const prepared: PreparedLine[] = [];

  for (const line of items) {
    const it = byId.get(line.menuItemId)!;
    const chosen = line.modifierIds ?? [];

    // Todas as opções escolhidas têm de existir, estar disponíveis e pertencer a
    // um grupo deste item.
    const itemGroupIds = new Set(groupsOfItem.get(line.menuItemId) ?? []);
    const chosenByGroup = new Map<string, number>();
    const lineMods: { id: string; name: string; delta: number }[] = [];
    for (const modId of chosen) {
      const m = modById.get(modId);
      if (!m || !m.available || !itemGroupIds.has(m.group_id)) {
        return { ok: false, error: "Opção inválida." };
      }
      chosenByGroup.set(m.group_id, (chosenByGroup.get(m.group_id) ?? 0) + 1);
      lineMods.push({ id: m.id, name: m.name, delta: m.price_delta_cents });
    }

    // Respeita min/max de cada grupo do item (ex.: ponto da carne obrigatório).
    for (const gid of itemGroupIds) {
      const g = groupById.get(gid)!;
      const n = chosenByGroup.get(gid) ?? 0;
      if (n < g.min_select || n > g.max_select) {
        return { ok: false, error: "Faltam opções obrigatórias." };
      }
    }

    const extra = lineMods.reduce((s, m) => s + m.delta, 0);
    prepared.push({
      itemId: it.id,
      name: it.name,
      unitPriceCents: it.price_cents + extra,
      qty: line.qty,
      notes: line.notes ?? null,
      modifiers: lineMods,
    });
  }

  const subtotal = prepared.reduce(
    (sum, l) => sum + l.unitPriceCents * l.qty,
    0,
  );

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

  if (orderErr || !order) return { ok: false, error: "Falha ao criar o pedido." };

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
    if (oiErr || !oi) return { ok: false, error: "Falha ao registar os itens." };

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

  return { ok: true, orderId: order.id };
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

  const supabase = createAdminClient();
  const { error } = await supabase.from("waiter_calls").insert({
    establishment_id: session.establishmentId,
    table_id: session.tableId,
    status: "open",
  });
  if (error) return { ok: false, error: "Falha ao chamar o atendente." };
  return { ok: true, orderId: "" };
}
