// Leitura do menu público de um estabelecimento (usado no fluxo do cliente).
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadStockContext, canMake } from "@/lib/recipes";

export type MenuModifier = {
  id: string;
  name: string;
  priceDeltaCents: number;
};

export type MenuModifierGroup = {
  id: string;
  name: string;
  single: boolean; // escolha única obrigatória vs múltipla opcional
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

  const { data: groups } = await supabase
    .from("modifier_groups")
    .select("id, menu_item_id, name, min_select, max_select, sort")
    .eq("establishment_id", establishmentId)
    .order("sort", { ascending: true });

  const { data: modifiers } = await supabase
    .from("modifiers")
    .select("id, group_id, name, price_delta_cents, available, sort")
    .eq("establishment_id", establishmentId)
    .eq("available", true)
    .order("sort", { ascending: true });

  // Stock de ingredientes + receitas: decide o que dá para fazer agora.
  const { ingredientStock, itemNeeds, modifierNeeds } =
    await loadStockContext(establishmentId);

  // Qualquer opção pode gastar ingredientes — tanto um extra opcional ("Bacon")
  // como uma escolha obrigatória que é mesmo um produto (a bebida de um combo).
  // O que interessa não é o tipo de grupo, é se a opção consome algo.
  //
  // Se um grupo OBRIGATÓRIO ficar sem opções porque esgotaram todas, o prato
  // deixa de ser configurável e sai do menu: sem bebida nenhuma não há combo.
  // Um grupo opcional vazio só desaparece a si próprio.
  const groupsByItem = new Map<string, MenuModifierGroup[]>();
  const itemsWithoutRequiredOption = new Set<string>();

  for (const g of groups ?? []) {
    const single = g.min_select === 1 && g.max_select === 1;
    const all = (modifiers ?? []).filter((m) => m.group_id === g.id);
    const groupMods = all
      .filter((m) => canMake(modifierNeeds.get(m.id), ingredientStock))
      .map((m) => ({
        id: m.id,
        name: m.name,
        priceDeltaCents: m.price_delta_cents,
      }));

    if (groupMods.length === 0) {
      // Só bloqueia o prato se HAVIA opções e o stock as levou a todas. Um grupo
      // ainda sem opções é o dono a meio da configuração — não se esconde nada.
      if (single && all.length > 0) itemsWithoutRequiredOption.add(g.menu_item_id);
      continue;
    }

    const list = groupsByItem.get(g.menu_item_id) ?? [];
    list.push({ id: g.id, name: g.name, single, modifiers: groupMods });
    groupsByItem.set(g.menu_item_id, list);
  }

  // Disponível = manual E stock próprio (se seguido) E dá para fazer com os
  // ingredientes atuais E não ficou sem uma escolha obrigatória. Esgotado = fora
  // do menu (nem chega a ser visto), em vez de aparecer a cinzento e o cliente
  // perceber tarde. O "esgotado" manual (available=false) continua a aparecer
  // desativado: é pausa, não ausência.
  const itemOrderable = (i: {
    id: string;
    track_stock: boolean;
    stock_qty: number;
  }) =>
    (!i.track_stock || i.stock_qty > 0) &&
    canMake(itemNeeds.get(i.id), ingredientStock) &&
    !itemsWithoutRequiredOption.has(i.id);

  return (
    categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        items: (items ?? [])
          .filter((i) => i.category_id === c.id)
          .filter(itemOrderable)
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
  const [{ data: items }, { data: mods }, { data: groups }, stock] =
    await Promise.all([
      supabase
        .from("menu_items")
        .select("id, track_stock, stock_qty")
        .eq("establishment_id", establishmentId),
      supabase
        .from("modifiers")
        .select("id, available, group_id")
        .eq("establishment_id", establishmentId)
        .eq("available", true),
      supabase
        .from("modifier_groups")
        .select("id, menu_item_id, min_select, max_select")
        .eq("establishment_id", establishmentId),
      loadStockContext(establishmentId),
    ]);

  const canUse = (modifierId: string) =>
    canMake(stock.modifierNeeds.get(modifierId), stock.ingredientStock);

  // Mesma regra do getMenu: se um grupo obrigatório ficou sem opções por stock,
  // o prato deixa de ser configurável e sai do menu.
  const modsByGroup = new Map<string, { id: string }[]>();
  for (const m of mods ?? []) {
    modsByGroup.set(m.group_id, [...(modsByGroup.get(m.group_id) ?? []), m]);
  }
  const itemsWithoutRequiredOption = new Set<string>();
  for (const g of groups ?? []) {
    if (!(g.min_select === 1 && g.max_select === 1)) continue;
    const all = modsByGroup.get(g.id) ?? [];
    if (all.length === 0) continue; // grupo por configurar, não bloqueia
    if (!all.some((m) => canUse(m.id))) {
      itemsWithoutRequiredOption.add(g.menu_item_id);
    }
  }

  return {
    items: (items ?? [])
      .filter(
        (i) =>
          (!i.track_stock || i.stock_qty > 0) &&
          canMake(stock.itemNeeds.get(i.id), stock.ingredientStock) &&
          !itemsWithoutRequiredOption.has(i.id),
      )
      .map((i) => i.id),
    modifiers: (mods ?? []).filter((m) => canUse(m.id)).map((m) => m.id),
  };
}
