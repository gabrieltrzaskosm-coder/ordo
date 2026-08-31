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
  kind: "artigo" | "ingrediente";
  name: string;
  stockQty: number;
  perDay: number; // ritmo de consumo (últimos 7 dias)
  etaDays: number; // dias até esgotar ao ritmo atual
  message: string;
};

/** "hoje" / "amanhã" / "em cerca de N dias". */
function whenLabel(etaDays: number): string {
  if (etaDays < 1) return "hoje";
  if (etaDays < 2) return "amanhã";
  return `em cerca de ${Math.round(etaDays)} dias`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Consumo de cada ingrediente nos últimos `days` dias, somando o que os pratos
 * gastaram pela receita E o que os extras escolhidos gastaram. É o equivalente,
 * do lado do consumo, ao que a reserva desconta ao criar o pedido.
 * Devolve ingredient_id -> unidades consumidas.
 */
async function getIngredientUsage(days: number): Promise<Map<string, number>> {
  const supabase = await createClient();
  const since = daysAgoIso(days);

  const { data: recipes } = await supabase
    .from("recipe_items")
    .select("ingredient_id, menu_item_id, modifier_id, qty");
  if (!recipes || recipes.length === 0) return new Map();

  const byItem = new Map<string, { ing: string; qty: number }[]>();
  const byMod = new Map<string, { ing: string; qty: number }[]>();
  for (const r of recipes) {
    const entry = { ing: r.ingredient_id, qty: r.qty };
    if (r.menu_item_id) {
      byItem.set(r.menu_item_id, [...(byItem.get(r.menu_item_id) ?? []), entry]);
    } else if (r.modifier_id) {
      byMod.set(r.modifier_id, [...(byMod.get(r.modifier_id) ?? []), entry]);
    }
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .neq("status", "cancelled")
    .gte("created_at", since);
  const validOrders = new Set((orders ?? []).map((o) => o.id));

  const { data: rawLines } = await supabase
    .from("order_items")
    .select("id, menu_item_id, qty, order_id")
    .gte("created_at", since);
  const lines = (rawLines ?? []).filter((l) => validOrders.has(l.order_id));
  if (lines.length === 0) return new Map();

  // Um extra vale por cada unidade da linha (igual ao cálculo da reserva).
  const lineQty = new Map(lines.map((l) => [l.id, l.qty]));
  const { data: chosen } = await supabase
    .from("order_item_modifiers")
    .select("order_item_id, modifier_id")
    .in("order_item_id", [...lineQty.keys()]);

  const usage = new Map<string, number>();
  const add = (ing: string, n: number) =>
    usage.set(ing, (usage.get(ing) ?? 0) + n);

  for (const l of lines) {
    if (!l.menu_item_id) continue;
    for (const r of byItem.get(l.menu_item_id) ?? []) add(r.ing, r.qty * l.qty);
  }
  for (const c of chosen ?? []) {
    if (!c.modifier_id) continue;
    const qty = lineQty.get(c.order_item_id);
    if (qty === undefined) continue;
    for (const r of byMod.get(c.modifier_id) ?? []) add(r.ing, r.qty * qty);
  }

  return usage;
}

/**
 * Alerta preditivo de stock: cruza o stock atual com o ritmo dos últimos 7 dias
 * e estima quando esgota. Cobre os DOIS níveis — artigos com stock próprio e
 * ingredientes — numa lista só, ordenada pelo que esgota primeiro, porque para
 * quem gere a pergunta é a mesma: o que é que me falta primeiro?
 */
export async function getStockAlerts(): Promise<StockAlert[]> {
  const supabase = await createClient();
  const since = daysAgoIso(7);
  const alerts: StockAlert[] = [];

  // ---- Artigos com stock próprio ----
  const { data: tracked } = await supabase
    .from("menu_items")
    .select("id, name, stock_qty")
    .eq("track_stock", true)
    .gt("stock_qty", 0);

  if (tracked && tracked.length > 0) {
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

    for (const [id, sold] of soldById) {
      const item = trackedById.get(id)!;
      const perDay = sold / 7;
      if (perDay <= 0) continue;
      const etaDays = item.stock_qty / perDay;
      alerts.push({
        kind: "artigo",
        name: item.name,
        stockQty: item.stock_qty,
        perDay: round1(perDay),
        etaDays,
        message: `${item.name}: ${item.stock_qty} em stock, sai ~${round1(
          perDay,
        )}/dia — esgota ${whenLabel(etaDays)}.`,
      });
    }
  }

  // ---- Ingredientes ----
  const { data: ings } = await supabase
    .from("ingredients")
    .select("id, name, stock_qty")
    .gt("stock_qty", 0);

  if (ings && ings.length > 0) {
    const usage = await getIngredientUsage(7);
    for (const g of ings) {
      const used = usage.get(g.id) ?? 0;
      const perDay = used / 7;
      if (perDay <= 0) continue;
      const etaDays = g.stock_qty / perDay;
      alerts.push({
        kind: "ingrediente",
        name: g.name,
        stockQty: g.stock_qty,
        perDay: round1(perDay),
        etaDays,
        message: `${g.name}: ${g.stock_qty} em stock, gasta ~${round1(
          perDay,
        )}/dia — esgota ${whenLabel(etaDays)}.`,
      });
    }
  }

  return alerts.sort((a, b) => a.etaDays - b.etaDays);
}

export type IngredientForecast = {
  name: string;
  stockQty: number;
  perDay: number; // consumo médio diário (últimos 14 dias)
  toBuy: number; // quanto falta para cobrir uma semana
};

/**
 * Previsão de consumo de ingredientes: ritmo médio dos últimos 14 dias e quanto
 * falta comprar para aguentar mais uma semana. Complementa a previsão de procura
 * (que diz o que preparar) com o lado das compras.
 */
export async function getIngredientForecast(): Promise<IngredientForecast[]> {
  const supabase = await createClient();
  const { data: ings } = await supabase
    .from("ingredients")
    .select("id, name, stock_qty");
  if (!ings || ings.length === 0) return [];

  const usage = await getIngredientUsage(14);

  return ings
    .map((g) => {
      const perDay = (usage.get(g.id) ?? 0) / 14;
      const weekNeed = Math.ceil(perDay * 7);
      return {
        name: g.name,
        stockQty: g.stock_qty,
        perDay,
        toBuy: Math.max(0, weekNeed - g.stock_qty),
      };
    })
    .filter((f) => f.perDay > 0)
    .sort((a, b) => b.perDay - a.perDay)
    .slice(0, 10);
}

// ---------- Snapshot compartilhado para a página Ordo IA ----------

type PredictionLine = {
  id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  qty: number;
  order_id: string;
  created_at: string;
};

type PredictionSnapshot = {
  trackedItems: { id: string; name: string; stock_qty: number }[];
  ingredients: { id: string; name: string; stock_qty: number }[];
  recipes: {
    ingredient_id: string;
    menu_item_id: string | null;
    modifier_id: string | null;
    qty: number;
  }[];
  orders: { id: string; created_at: string }[];
  lines: PredictionLine[];
  chosen: { order_item_id: string; modifier_id: string | null }[];
};

async function loadPredictionSnapshot(): Promise<PredictionSnapshot> {
  const supabase = await createClient();
  const since = daysAgoIso(14);

  const [trackedResult, ingredientsResult, recipesResult, ordersResult, linesResult] =
    await Promise.all([
      supabase
        .from("menu_items")
        .select("id, name, stock_qty")
        .eq("track_stock", true)
        .gt("stock_qty", 0),
      supabase.from("ingredients").select("id, name, stock_qty"),
      supabase
        .from("recipe_items")
        .select("ingredient_id, menu_item_id, modifier_id, qty"),
      supabase
        .from("orders")
        .select("id, created_at")
        .neq("status", "cancelled")
        .gte("created_at", since),
      supabase
        .from("order_items")
        .select("id, menu_item_id, name_snapshot, qty, order_id, created_at")
        .gte("created_at", since),
    ]);

  const lines = (linesResult.data ?? []) as PredictionLine[];
  const chosenResult =
    lines.length === 0
      ? { data: [] as PredictionSnapshot["chosen"] }
      : await supabase
          .from("order_item_modifiers")
          .select("order_item_id, modifier_id")
          .in("order_item_id", lines.map((line) => line.id));

  return {
    trackedItems: trackedResult.data ?? [],
    ingredients: ingredientsResult.data ?? [],
    recipes: recipesResult.data ?? [],
    orders: ordersResult.data ?? [],
    lines,
    chosen: chosenResult.data ?? [],
  };
}

function snapshotUsage(
  snapshot: PredictionSnapshot,
  days: 7 | 14,
): Map<string, number> {
  const cutoff = Date.now() - days * 86_400_000;
  const validOrderIds = new Set(
    snapshot.orders
      .filter((order) => new Date(order.created_at).getTime() >= cutoff)
      .map((order) => order.id),
  );
  const byItem = new Map<string, { ingredientId: string; qty: number }[]>();
  const byModifier = new Map<string, { ingredientId: string; qty: number }[]>();

  for (const recipe of snapshot.recipes) {
    const target = recipe.menu_item_id ? byItem : byModifier;
    const targetId = recipe.menu_item_id ?? recipe.modifier_id;
    if (!targetId) continue;
    target.set(targetId, [
      ...(target.get(targetId) ?? []),
      { ingredientId: recipe.ingredient_id, qty: recipe.qty },
    ]);
  }

  const lineQty = new Map(
    snapshot.lines
      .filter((line) => validOrderIds.has(line.order_id))
      .map((line) => [line.id, line.qty]),
  );
  const usage = new Map<string, number>();
  const add = (ingredientId: string, amount: number) =>
    usage.set(ingredientId, (usage.get(ingredientId) ?? 0) + amount);

  for (const line of snapshot.lines) {
    if (!line.menu_item_id || !lineQty.has(line.id)) continue;
    for (const recipe of byItem.get(line.menu_item_id) ?? []) {
      add(recipe.ingredientId, recipe.qty * line.qty);
    }
  }
  for (const chosen of snapshot.chosen) {
    const qty = lineQty.get(chosen.order_item_id);
    if (qty === undefined || !chosen.modifier_id) continue;
    for (const recipe of byModifier.get(chosen.modifier_id) ?? []) {
      add(recipe.ingredientId, recipe.qty * qty);
    }
  }
  return usage;
}

function snapshotDemand(snapshot: PredictionSnapshot): ForecastItem[] {
  const validOrderIds = new Set(snapshot.orders.map((order) => order.id));
  const totals = new Map<string, { name: string; qty: number }>();
  for (const line of snapshot.lines) {
    if (!validOrderIds.has(line.order_id)) continue;
    const current = totals.get(line.name_snapshot) ?? {
      name: line.name_snapshot,
      qty: 0,
    };
    current.qty += line.qty;
    totals.set(line.name_snapshot, current);
  }
  return [...totals.values()]
    .map((item) => {
      const perDay = item.qty / 14;
      return {
        name: item.name,
        perDay,
        suggested: Math.max(1, Math.ceil(perDay)),
      };
    })
    .sort((a, b) => b.perDay - a.perDay)
    .slice(0, 8);
}

function snapshotAlerts(snapshot: PredictionSnapshot): StockAlert[] {
  const since = Date.now() - 7 * 86_400_000;
  const validOrderIds = new Set(
    snapshot.orders
      .filter((order) => new Date(order.created_at).getTime() >= since)
      .map((order) => order.id),
  );
  const sold = new Map<string, number>();
  for (const line of snapshot.lines) {
    if (!line.menu_item_id || !validOrderIds.has(line.order_id)) continue;
    sold.set(line.menu_item_id, (sold.get(line.menu_item_id) ?? 0) + line.qty);
  }

  const alerts: StockAlert[] = [];
  for (const item of snapshot.trackedItems) {
    const perDay = (sold.get(item.id) ?? 0) / 7;
    if (perDay <= 0) continue;
    const etaDays = item.stock_qty / perDay;
    alerts.push({
      kind: "artigo",
      name: item.name,
      stockQty: item.stock_qty,
      perDay: round1(perDay),
      etaDays,
      message: `${item.name}: ${item.stock_qty} em stock, sai ~${round1(perDay)}/dia — esgota ${whenLabel(etaDays)}.`,
    });
  }

  const usage = snapshotUsage(snapshot, 7);
  for (const ingredient of snapshot.ingredients) {
    const perDay = (usage.get(ingredient.id) ?? 0) / 7;
    if (perDay <= 0) continue;
    const etaDays = ingredient.stock_qty / perDay;
    alerts.push({
      kind: "ingrediente",
      name: ingredient.name,
      stockQty: ingredient.stock_qty,
      perDay: round1(perDay),
      etaDays,
      message: `${ingredient.name}: ${ingredient.stock_qty} em stock, gasta ~${round1(perDay)}/dia — esgota ${whenLabel(etaDays)}.`,
    });
  }
  return alerts.sort((a, b) => a.etaDays - b.etaDays);
}

function snapshotIngredientForecast(
  snapshot: PredictionSnapshot,
): IngredientForecast[] {
  const usage = snapshotUsage(snapshot, 14);
  return snapshot.ingredients
    .map((ingredient) => {
      const perDay = (usage.get(ingredient.id) ?? 0) / 14;
      const weekNeed = Math.ceil(perDay * 7);
      return {
        name: ingredient.name,
        stockQty: ingredient.stock_qty,
        perDay,
        toBuy: Math.max(0, weekNeed - ingredient.stock_qty),
      };
    })
    .filter((item) => item.perDay > 0)
    .sort((a, b) => b.perDay - a.perDay)
    .slice(0, 10);
}

/** Carrega uma vez os dados comuns às três áreas da tela Ordo IA. */
export async function getPredictionSnapshot(): Promise<{
  forecast: ForecastItem[];
  alerts: StockAlert[];
  ingredients: IngredientForecast[];
}> {
  const snapshot = await loadPredictionSnapshot();
  return {
    forecast: snapshotDemand(snapshot),
    alerts: snapshotAlerts(snapshot),
    ingredients: snapshotIngredientForecast(snapshot),
  };
}
