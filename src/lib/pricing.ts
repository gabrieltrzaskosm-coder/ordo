// Validação e preço de um pedido. Módulo PURO: recebe o que já foi lido da base
// de dados e devolve as linhas prontas ou um erro.
//
// É aqui que vive a regra mais importante do fluxo de dinheiro: o preço é SEMPRE
// recalculado a partir dos dados do servidor, nunca do que o browser mandou. O
// cliente só diz "que artigo" e "que opções" — todos os valores vêm daqui.

export type PricedItem = {
  id: string;
  name: string;
  priceCents: number;
  available: boolean;
  trackStock: boolean;
  stockQty: number;
};

export type PricedGroup = {
  id: string;
  menuItemId: string;
  minSelect: number;
  maxSelect: number;
};

export type PricedModifier = {
  id: string;
  groupId: string;
  name: string;
  priceDeltaCents: number;
  available: boolean;
};

/** O que veio do browser (já validado no formato por zod). */
export type RequestedLine = {
  menuItemId: string;
  qty: number;
  notes?: string;
  modifierIds?: string[];
};

export type PreparedLine = {
  itemId: string;
  name: string;
  unitPriceCents: number;
  qty: number;
  notes: string | null;
  modifiers: { id: string; name: string; delta: number }[];
};

export type PrepareResult =
  | { ok: true; lines: PreparedLine[]; subtotalCents: number }
  | { ok: false; error: string };

/** Total pedido por artigo (várias linhas podem repetir o artigo com opções diferentes). */
export function qtyByItem(requested: RequestedLine[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const l of requested) {
    out.set(l.menuItemId, (out.get(l.menuItemId) ?? 0) + l.qty);
  }
  return out;
}

/**
 * Valida as linhas pedidas e calcula os preços.
 *
 * Recusa: artigo desconhecido ou indisponível; artigo sem stock suficiente;
 * opção inexistente, indisponível ou de outro artigo; e grupos cujo min/max não
 * é respeitado (ex.: falta o ponto da carne).
 *
 * A verificação de stock aqui serve para falhar cedo com uma mensagem boa — NÃO
 * é o que garante que não se vende a mais. Isso é a reserva atómica na base de
 * dados, que decide com as linhas bloqueadas.
 */
export function prepareOrderLines(
  requested: RequestedLine[],
  items: Map<string, PricedItem>,
  groups: PricedGroup[],
  modifiers: Map<string, PricedModifier>,
): PrepareResult {
  // Disponibilidade efetiva: manual E (não segue stock OU tem stock).
  for (const line of requested) {
    const it = items.get(line.menuItemId);
    if (!it || !it.available || (it.trackStock && it.stockQty <= 0)) {
      return { ok: false, error: "Item indisponível." };
    }
  }

  for (const [itemId, qty] of qtyByItem(requested)) {
    const it = items.get(itemId)!;
    if (it.trackStock && it.stockQty < qty) {
      return { ok: false, error: `Sem stock suficiente de ${it.name}.` };
    }
  }

  const groupsOfItem = new Map<string, PricedGroup[]>();
  for (const g of groups) {
    groupsOfItem.set(g.menuItemId, [...(groupsOfItem.get(g.menuItemId) ?? []), g]);
  }

  const lines: PreparedLine[] = [];

  for (const line of requested) {
    const it = items.get(line.menuItemId)!;
    const itemGroups = groupsOfItem.get(line.menuItemId) ?? [];
    const itemGroupIds = new Set(itemGroups.map((g) => g.id));

    const chosenByGroup = new Map<string, number>();
    const lineMods: { id: string; name: string; delta: number }[] = [];

    for (const modId of line.modifierIds ?? []) {
      const m = modifiers.get(modId);
      // Tem de existir, estar disponível e pertencer a um grupo DESTE artigo —
      // senão dava para colar uma opção barata de outro prato.
      if (!m || !m.available || !itemGroupIds.has(m.groupId)) {
        return { ok: false, error: "Opção inválida." };
      }
      chosenByGroup.set(m.groupId, (chosenByGroup.get(m.groupId) ?? 0) + 1);
      lineMods.push({ id: m.id, name: m.name, delta: m.priceDeltaCents });
    }

    for (const g of itemGroups) {
      const n = chosenByGroup.get(g.id) ?? 0;
      if (n < g.minSelect || n > g.maxSelect) {
        return { ok: false, error: "Faltam opções obrigatórias." };
      }
    }

    const extra = lineMods.reduce((s, m) => s + m.delta, 0);
    lines.push({
      itemId: it.id,
      name: it.name,
      unitPriceCents: it.priceCents + extra,
      qty: line.qty,
      notes: line.notes ?? null,
      modifiers: lineMods,
    });
  }

  return {
    ok: true,
    lines,
    subtotalCents: lines.reduce((s, l) => s + l.unitPriceCents * l.qty, 0),
  };
}
