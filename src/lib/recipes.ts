// Receitas + stock de ingredientes. Camada partilhada pela leitura do menu
// (disponibilidade), pelo polling do cliente e pela criação do pedido (reserva).
//
// "Contagem simples": tudo em unidades inteiras. Um prato/extra tem uma lista de
// ingredientes com a quantidade que gasta por unidade vendida. Um alvo (prato ou
// extra) está disponível se DÁ para fazer pelo menos um com o stock atual.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type IngredientNeed = { ingredientId: string; qty: number };

export type StockContext = {
  ingredientStock: Map<string, number>; // ingredient_id -> stock atual
  itemNeeds: Map<string, IngredientNeed[]>; // menu_item_id -> ingredientes
  modifierNeeds: Map<string, IngredientNeed[]>; // modifier_id -> ingredientes
};

/** Carrega ingredientes + receitas de um estabelecimento (service role). */
export async function loadStockContext(
  establishmentId: string,
): Promise<StockContext> {
  const supabase = createAdminClient();
  const [{ data: ings }, { data: recipes }] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, stock_qty")
      .eq("establishment_id", establishmentId),
    supabase
      .from("recipe_items")
      .select("ingredient_id, menu_item_id, modifier_id, qty")
      .eq("establishment_id", establishmentId),
  ]);

  const ingredientStock = new Map<string, number>();
  for (const g of ings ?? []) ingredientStock.set(g.id, g.stock_qty);

  const itemNeeds = new Map<string, IngredientNeed[]>();
  const modifierNeeds = new Map<string, IngredientNeed[]>();
  for (const r of recipes ?? []) {
    const need: IngredientNeed = { ingredientId: r.ingredient_id, qty: r.qty };
    if (r.menu_item_id) {
      const l = itemNeeds.get(r.menu_item_id) ?? [];
      l.push(need);
      itemNeeds.set(r.menu_item_id, l);
    } else if (r.modifier_id) {
      const l = modifierNeeds.get(r.modifier_id) ?? [];
      l.push(need);
      modifierNeeds.set(r.modifier_id, l);
    }
  }

  return { ingredientStock, itemNeeds, modifierNeeds };
}

/** Dá para fazer pelo menos um, dado o stock atual? Sem receita = sim. */
export function canMake(
  needs: IngredientNeed[] | undefined,
  stock: Map<string, number>,
): boolean {
  if (!needs || needs.length === 0) return true;
  for (const n of needs) {
    if ((stock.get(n.ingredientId) ?? 0) < n.qty) return false;
  }
  return true;
}
