// Resolução da "sessão de mesa" do cliente anónimo a partir do qr_token.
// Este é o ponto único onde um qr_token é traduzido para mesa + estabelecimento.
// Todo o código do cliente (menu, pedido, chamar atendente) deve começar aqui e
// restringir as operações ao establishment_id/table_id devolvidos.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Plan } from "@/lib/plans";

export type TableSession = {
  tableId: string;
  establishmentId: string;
  establishmentName: string;
  currency: string;
  tableLabel: string;
  plan: Plan;
};

export async function resolveTableSession(
  qrToken: string,
): Promise<TableSession | null> {
  if (!qrToken) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select(
      "id, label, active, establishment_id, establishments(name, currency, plan)",
    )
    .eq("qr_token", qrToken)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;

  const est = data.establishments as unknown as {
    name: string;
    currency: string;
    plan: Plan;
  } | null;
  if (!est) return null;

  return {
    tableId: data.id,
    establishmentId: data.establishment_id,
    establishmentName: est.name,
    currency: est.currency,
    tableLabel: data.label,
    plan: est.plan,
  };
}

/**
 * Artigo mais pedido do estabelecimento (últimos 30 dias) — para o destaque no
 * menu do cliente (plano Max). Admin client: o fluxo do cliente é anónimo.
 * Devolve o menu_item_id do topo, ou null se não houver dados.
 */
export async function getBestSellerItemId(
  establishmentId: string,
): Promise<string | null> {
  const supabase = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("establishment_id", establishmentId)
    .neq("status", "cancelled")
    .gte("created_at", since.toISOString());
  const validIds = new Set((orders ?? []).map((o) => o.id));

  const { data: items } = await supabase
    .from("order_items")
    .select("menu_item_id, qty, order_id")
    .eq("establishment_id", establishmentId)
    .gte("created_at", since.toISOString());

  const qtyById = new Map<string, number>();
  for (const it of items ?? []) {
    if (!it.menu_item_id || !validIds.has(it.order_id)) continue;
    qtyById.set(it.menu_item_id, (qtyById.get(it.menu_item_id) ?? 0) + it.qty);
  }

  let topId: string | null = null;
  let topQty = 0;
  for (const [id, qty] of qtyById) {
    if (qty > topQty) {
      topQty = qty;
      topId = id;
    }
  }
  return topId;
}
