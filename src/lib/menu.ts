// Leitura do menu público de um estabelecimento (usado no fluxo do cliente).
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadStockContext } from "@/lib/recipes";
import {
  resolveGroups,
  isItemOrderable,
  type GroupRow,
  type ModifierRow,
} from "@/lib/availability";

export type MenuModifier = {
  id: string;
  name: string;
  priceDeltaCents: number;
};

export type MenuModifierGroup = {
  id: string;
  name: string;
  single: boolean; // escolha única obrigatória vs múltipla opcional
  maxSelect: number; // teto de unidades no grupo (conta a quantidade por extra)
  modifiers: MenuModifier[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  available: boolean;
  imageUrl: string | null;
  groups: MenuModifierGroup[];
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export async function getMenu(establishmentId: string): Promise<MenuCategory[]> {
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from("menu_categories")
    .select("id, name, sort")
    .eq("establishment_id", establishmentId)
    .order("sort", { ascending: true });

  if (!categories?.length) return [];

  const { data: items } = await supabase
    .from("menu_items")
    .select(
      "id, name, description, price_cents, available, image_url, category_id, sort, track_stock, stock_qty",
    )
    .eq("establishment_id", establishmentId)
    .order("sort", { ascending: true });

  const groupRows = await loadGroupRows(establishmentId);

  const { data: modifiers } = await supabase
    .from("modifiers")
    .select("id, group_id, name, price_delta_cents, available, sort")
    .eq("establishment_id", establishmentId)
    .eq("available", true)
    .order("sort", { ascending: true });

  // Stock de ingredientes + receitas: decide o que dá para fazer agora.
  const { ingredientStock, itemNeeds, modifierNeeds } =
    await loadStockContext(establishmentId);

  // Toda a regra de disponibilidade vive em `availability.ts` (pura, testada).
  const { groupsByItem, itemsWithoutRequiredOption } = resolveGroups(
    groupRows,
    (modifiers ?? []).map(toModifierRow),
    modifierNeeds,
    ingredientStock,
  );

  return (
    categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        items: (items ?? [])
          .filter((i) => i.category_id === c.id)
          // Esgotado = fora do menu (nem chega a ser visto), em vez de aparecer
          // a cinzento e o cliente perceber tarde. O "esgotado" manual
          // (available=false) continua a mostrar-se desativado: é pausa, não
          // ausência — por isso não entra na regra de disponibilidade.
          .filter((i) =>
            isItemOrderable(
              { id: i.id, trackStock: i.track_stock, stockQty: i.stock_qty },
              itemNeeds,
              ingredientStock,
              itemsWithoutRequiredOption,
            ),
          )
          .map((i) => ({
            id: i.id,
            name: i.name,
            description: i.description,
            priceCents: i.price_cents,
            available: i.available,
            imageUrl: i.image_url,
            groups: groupsByItem.get(i.id) ?? [],
          })),
      }))
      // Categoria que ficou sem artigos não deve mostrar um cabeçalho vazio.
      .filter((c) => c.items.length > 0)
  );
}

/**
 * Grupos ligados aos pratos, um GroupRow por ligação (prato × grupo). Um grupo
 * reutilizado aparece uma vez por cada prato onde está — é o que resolveGroups
 * espera. A ligação vem de item_modifier_groups; o grupo dá o nome e min/max.
 */
async function loadGroupRows(establishmentId: string): Promise<GroupRow[]> {
  const supabase = createAdminClient();
  const [{ data: links }, { data: groups }] = await Promise.all([
    supabase
      .from("item_modifier_groups")
      .select("menu_item_id, group_id, sort")
      .eq("establishment_id", establishmentId)
      .order("sort", { ascending: true }),
    supabase
      .from("modifier_groups")
      .select("id, name, min_select, max_select")
      .eq("establishment_id", establishmentId),
  ]);

  const byId = new Map((groups ?? []).map((g) => [g.id, g]));
  const rows: GroupRow[] = [];
  for (const l of links ?? []) {
    const g = byId.get(l.group_id);
    if (g) {
      rows.push({
        id: g.id,
        menuItemId: l.menu_item_id,
        name: g.name,
        minSelect: g.min_select,
        maxSelect: g.max_select,
      });
    }
  }
  return rows;
}

// ---- Adaptadores das linhas da BD para o formato do módulo puro ----
type DbModifier = {
  id: string;
  group_id: string;
  name: string;
  price_delta_cents: number;
};
function toModifierRow(m: DbModifier): ModifierRow {
  return {
    id: m.id,
    groupId: m.group_id,
    name: m.name,
    priceDeltaCents: m.price_delta_cents,
  };
}

export type OrderableIds = { items: string[]; modifiers: string[] };

/**
 * Ids dos artigos E extras que o cliente pode pedir agora. Usado pelo polling do
 * menu para fazer desaparecer, sem recarregar a página, o que esgotou entretanto
 * — seja o prato ou um ingrediente que um extra usa. De propósito mais leve que
 * getMenu(): só ids.
 */
export async function getOrderableItemIds(
  establishmentId: string,
): Promise<OrderableIds> {
  const supabase = createAdminClient();
  const [{ data: items }, { data: mods }, groupRows, stock] =
    await Promise.all([
      supabase
        .from("menu_items")
        .select("id, track_stock, stock_qty")
        .eq("establishment_id", establishmentId),
      supabase
        .from("modifiers")
        .select("id, group_id, name, price_delta_cents, available")
        .eq("establishment_id", establishmentId)
        .eq("available", true),
      loadGroupRows(establishmentId),
      loadStockContext(establishmentId),
    ]);

  // Exatamente a mesma resolução do getMenu, para as duas superfícies nunca
  // divergirem: o que sai do menu no carregamento sai também no polling.
  const { itemsWithoutRequiredOption, orderableModifierIds } = resolveGroups(
    groupRows,
    (mods ?? []).map(toModifierRow),
    stock.modifierNeeds,
    stock.ingredientStock,
  );

  return {
    items: (items ?? [])
      .filter((i) =>
        isItemOrderable(
          { id: i.id, trackStock: i.track_stock, stockQty: i.stock_qty },
          stock.itemNeeds,
          stock.ingredientStock,
          itemsWithoutRequiredOption,
        ),
      )
      .map((i) => i.id),
    modifiers: [...orderableModifierIds],
  };
}
