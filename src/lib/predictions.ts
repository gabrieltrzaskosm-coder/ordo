// Previsões do plano Max, calculadas dos dados (sem LLM): previsão de procura e
// alerta preditivo de stock. É estatística simples — a qualidade sobe com o
// volume de dados. Corre sob a sessão do manager (RLS).
import "server-only";
import { createClient } from "@/lib/supabase/server";

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export type ForecastItem = {
  name: string;
  perDay: number; // média por dia (últimos 14 dias)
  suggested: number; // sugestão a preparar (arredondado para cima)
};

/** Previsão de procura: média diária por artigo nos últimos 14 dias. */
export async function getDemandForecast(): Promise<ForecastItem[]> {
  const supabase = await createClient();
  const since = daysAgoIso(14);

  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .neq("status", "cancelled")
    .gte("created_at", since);
  const validIds = new Set((orders ?? []).map((o) => o.id));

  const { data: items } = await supabase
    .from("order_items")
    .select("name_snapshot, qty, order_id")
    .gte("created_at", since);

  const totalByName = new Map<string, number>();
  for (const it of items ?? []) {
    if (!validIds.has(it.order_id)) continue;
    totalByName.set(
      it.name_snapshot,
      (totalByName.get(it.name_snapshot) ?? 0) + it.qty,
    );
  }

  return [...totalByName.entries()]
    .map(([name, total]) => {
      const perDay = total / 14;
      return { name, perDay, suggested: Math.max(1, Math.ceil(perDay)) };
    })
    .sort((a, b) => b.perDay - a.perDay)
    .slice(0, 8);
}

export type StockAlert = {
  name: string;
  stockQty: number;
  perDay: number; // ritmo de venda (últimos 7 dias)
  etaDays: number; // dias até esgotar ao ritmo atual
  message: string;
};

/**
 * Alerta preditivo de stock: cruza o stock atual com o ritmo de venda dos
 * últimos 7 dias e estima quando esgota. Só artigos seguidos e com vendas.
 */
export async function getStockAlerts(): Promise<StockAlert[]> {
  const supabase = await createClient();
  const since = daysAgoIso(7);

  const { data: tracked } = await supabase
    .from("menu_items")
    .select("id, name, stock_qty")
    .eq("track_stock", true)
    .gt("stock_qty", 0);
  if (!tracked || tracked.length === 0) return [];

  const trackedById = new Map(tracked.map((t) => [t.id, t]));

  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .neq("status", "cancelled")
    .gte("created_at", since);
  const validIds = new Set((orders ?? []).map((o) => o.id));

  const { data: items } = await supabase
    .from("order_items")
    .select("menu_item_id, qty, order_id")
    .gte("created_at", since);

  const soldById = new Map<string, number>();
  for (const it of items ?? []) {
    if (!it.menu_item_id || !validIds.has(it.order_id)) continue;
    if (!trackedById.has(it.menu_item_id)) continue;
    soldById.set(
      it.menu_item_id,
      (soldById.get(it.menu_item_id) ?? 0) + it.qty,
    );
  }

  const alerts: StockAlert[] = [];
  for (const [id, sold] of soldById) {
    const item = trackedById.get(id)!;
    const perDay = sold / 7;
    if (perDay <= 0) continue;
    const etaDays = item.stock_qty / perDay;

    let when: string;
    if (etaDays < 1) when = "hoje";
    else if (etaDays < 2) when = "amanhã";
    else when = `em cerca de ${Math.round(etaDays)} dias`;

    alerts.push({
      name: item.name,
      stockQty: item.stock_qty,
      perDay: Math.round(perDay * 10) / 10,
      etaDays,
      message: `${item.name}: ${item.stock_qty} em stock, sai ~${
        Math.round(perDay * 10) / 10
      }/dia — esgota ${when}.`,
    });
  }

  return alerts.sort((a, b) => a.etaDays - b.etaDays);
}
