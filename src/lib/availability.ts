// Regras de disponibilidade e de consumo de ingredientes. Módulo PURO: sem I/O,
// sem "server-only" — por isso é testável e é a única fonte destas decisões.
// Quem fala com a base de dados (menu.ts, recipes.ts, placeOrder) traz os dados
// e chama isto.

export type IngredientNeed = { ingredientId: string; qty: number };

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

// ---------- O que se pode oferecer ----------

export type GroupRow = {
  id: string;
  menuItemId: string;
  name: string;
  minSelect: number;
  maxSelect: number;
};

export type ModifierRow = {
  id: string;
  groupId: string;
  name: string;
  priceDeltaCents: number;
};

export type ResolvedGroup = {
  id: string;
  name: string;
  single: boolean;
  modifiers: { id: string; name: string; priceDeltaCents: number }[];
};

export type ResolvedGroups = {
  /** Grupos com opções, por artigo — já sem o que esgotou. */
  groupsByItem: Map<string, ResolvedGroup[]>;
  /** Artigos cujo grupo OBRIGATÓRIO ficou sem opções: saem do menu. */
  itemsWithoutRequiredOption: Set<string>;
  /** Opções que ainda se podem escolher. */
  orderableModifierIds: Set<string>;
};

/**
 * Resolve grupos e opções contra o stock de ingredientes.
 *
 * Qualquer opção pode gastar ingredientes — um extra opcional ("Bacon") ou uma
 * escolha obrigatória que é mesmo um produto (a bebida de um combo). O que
 * decide não é o tipo de grupo, é se a opção consome algo.
 *
 * Se um grupo obrigatório fica sem opções porque esgotaram TODAS, o artigo
 * deixa de ser configurável e sai do menu: sem bebida nenhuma não há combo. Um
 * grupo opcional vazio só desaparece a si próprio.
 *
 * Distingue-se "vazio por stock" de "ainda sem opções configuradas": o segundo é
 * o dono a meio da configuração e não esconde nada.
 */
export function resolveGroups(
  groups: GroupRow[],
  modifiers: ModifierRow[],
  modifierNeeds: Map<string, IngredientNeed[]>,
  stock: Map<string, number>,
): ResolvedGroups {
  const groupsByItem = new Map<string, ResolvedGroup[]>();
  const itemsWithoutRequiredOption = new Set<string>();
  const orderableModifierIds = new Set<string>();

  for (const g of groups) {
    const single = g.minSelect === 1 && g.maxSelect === 1;
    const all = modifiers.filter((m) => m.groupId === g.id);
    const available = all.filter((m) => canMake(modifierNeeds.get(m.id), stock));

    for (const m of available) orderableModifierIds.add(m.id);

    if (available.length === 0) {
      if (single && all.length > 0) itemsWithoutRequiredOption.add(g.menuItemId);
      continue;
    }

    const list = groupsByItem.get(g.menuItemId) ?? [];
    list.push({
      id: g.id,
      name: g.name,
      single,
      modifiers: available.map((m) => ({
        id: m.id,
        name: m.name,
        priceDeltaCents: m.priceDeltaCents,
      })),
    });
    groupsByItem.set(g.menuItemId, list);
  }

  return { groupsByItem, itemsWithoutRequiredOption, orderableModifierIds };
}

/**
 * Um artigo pode ser pedido agora? Stock próprio (se o seguir) E ingredientes da
 * receita E não lhe faltar uma escolha obrigatória.
 *
 * NÃO inclui o "esgotado" manual (`available`): esse continua a mostrar-se
 * desativado no menu, porque é uma pausa e não uma ausência de produto.
 */
export function isItemOrderable(
  item: { id: string; trackStock: boolean; stockQty: number },
  itemNeeds: Map<string, IngredientNeed[]>,
  stock: Map<string, number>,
  itemsWithoutRequiredOption: Set<string>,
): boolean {
  if (item.trackStock && item.stockQty <= 0) return false;
  if (!canMake(itemNeeds.get(item.id), stock)) return false;
  return !itemsWithoutRequiredOption.has(item.id);
}

// ---------- O que um pedido consome ----------

export type ConsumingLine = {
  itemId: string;
  qty: number;
  modifierIds: string[];
};

/**
 * Ingredientes que um pedido gasta: receita do artigo + receita de cada opção
 * escolhida, tudo multiplicado pela quantidade da linha e somado por
 * ingrediente (o mesmo ingrediente pode vir de vários artigos/opções).
 *
 * Uma opção conta por cada unidade da linha: 2 hambúrgueres com bacon gastam
 * 2 bacons.
 */
export function aggregateIngredientNeeds(
  lines: ConsumingLine[],
  itemNeeds: Map<string, IngredientNeed[]>,
  modifierNeeds: Map<string, IngredientNeed[]>,
): Map<string, number> {
  const total = new Map<string, number>();
  const add = (needs: IngredientNeed[] | undefined, times: number) => {
    for (const n of needs ?? []) {
      total.set(n.ingredientId, (total.get(n.ingredientId) ?? 0) + n.qty * times);
    }
  };

  for (const l of lines) {
    add(itemNeeds.get(l.itemId), l.qty);
    for (const modId of l.modifierIds) add(modifierNeeds.get(modId), l.qty);
  }

  return total;
}
