// Regras de stock ao nível do ingrediente: o que sai do menu quando algo esgota,
// e quanto um pedido consome. É a lógica que decide se um combo aparece e se o
// "último pão" tira o hambúrguer do ecrã.
import { describe, it, expect } from "vitest";
import {
  canMake,
  resolveGroups,
  isItemOrderable,
  aggregateIngredientNeeds,
  type GroupRow,
  type ModifierRow,
  type IngredientNeed,
} from "@/lib/availability";

const stock = (o: Record<string, number>) => new Map(Object.entries(o));
const needs = (o: Record<string, IngredientNeed[]>) => new Map(Object.entries(o));

describe("canMake", () => {
  it("sem receita, faz-se sempre", () => {
    expect(canMake(undefined, stock({}))).toBe(true);
    expect(canMake([], stock({}))).toBe(true);
  });
  it("precisa de stock >= qty de cada ingrediente", () => {
    const s = stock({ pao: 1, carne: 0 });
    expect(canMake([{ ingredientId: "pao", qty: 1 }], s)).toBe(true);
    expect(canMake([{ ingredientId: "carne", qty: 1 }], s)).toBe(false);
  });
  it("um ingrediente em falta chega para bloquear", () => {
    const s = stock({ pao: 5, queijo: 0 });
    const r = [
      { ingredientId: "pao", qty: 1 },
      { ingredientId: "queijo", qty: 1 },
    ];
    expect(canMake(r, s)).toBe(false);
  });
});

describe("resolveGroups — extra opcional", () => {
  const groups: GroupRow[] = [
    { id: "g", menuItemId: "burger", name: "Extras", minSelect: 0, maxSelect: 99 },
  ];
  const mods: ModifierRow[] = [
    { id: "bacon", groupId: "g", name: "Bacon", priceDeltaCents: 150 },
    { id: "ovo", groupId: "g", name: "Ovo", priceDeltaCents: 100 },
  ];

  it("esconde só o extra cujo ingrediente esgotou", () => {
    const r = resolveGroups(
      groups,
      mods,
      needs({ bacon: [{ ingredientId: "i_bacon", qty: 1 }] }),
      stock({ i_bacon: 0 }),
    );
    expect(r.orderableModifierIds.has("bacon")).toBe(false);
    expect(r.orderableModifierIds.has("ovo")).toBe(true);
    // Grupo opcional a esvaziar não bloqueia o prato.
    expect(r.itemsWithoutRequiredOption.has("burger")).toBe(false);
  });
});

describe("resolveGroups — bebida obrigatória do combo", () => {
  const groups: GroupRow[] = [
    { id: "g", menuItemId: "combo", name: "Bebida", minSelect: 1, maxSelect: 1 },
  ];
  const mods: ModifierRow[] = [
    { id: "refri", groupId: "g", name: "Refrigerante", priceDeltaCents: 0 },
    { id: "agua", groupId: "g", name: "Água", priceDeltaCents: 0 },
  ];
  const modNeeds = needs({
    refri: [{ ingredientId: "lata", qty: 1 }],
    agua: [{ ingredientId: "garrafa", qty: 1 }],
  });

  it("rutura parcial: some a opção, o combo mantém-se", () => {
    const r = resolveGroups(groups, mods, modNeeds, stock({ lata: 0, garrafa: 5 }));
    expect(r.orderableModifierIds.has("refri")).toBe(false);
    expect(r.orderableModifierIds.has("agua")).toBe(true);
    expect(r.itemsWithoutRequiredOption.has("combo")).toBe(false);
  });

  it("rutura total: o combo perde a escolha obrigatória e sai do menu", () => {
    const r = resolveGroups(groups, mods, modNeeds, stock({ lata: 0, garrafa: 0 }));
    expect(r.itemsWithoutRequiredOption.has("combo")).toBe(true);
    expect(r.groupsByItem.has("combo")).toBe(false);
  });

  it("grupo obrigatório AINDA SEM opções não bloqueia (dono a configurar)", () => {
    const r = resolveGroups(groups, [], modNeeds, stock({}));
    expect(r.itemsWithoutRequiredOption.has("combo")).toBe(false);
  });
});

describe("isItemOrderable", () => {
  const empty = new Map<string, IngredientNeed[]>();
  const noBlock = new Set<string>();

  it("artigo simples sem stock nem receita está sempre disponível", () => {
    const ok = isItemOrderable(
      { id: "x", trackStock: false, stockQty: 0 },
      empty,
      stock({}),
      noBlock,
    );
    expect(ok).toBe(true);
  });

  it("artigo com stock próprio a zero sai", () => {
    const ok = isItemOrderable(
      { id: "x", trackStock: true, stockQty: 0 },
      empty,
      stock({}),
      noBlock,
    );
    expect(ok).toBe(false);
  });

  it("o último pão: receita sem stock tira o prato", () => {
    const ok = isItemOrderable(
      { id: "burger", trackStock: false, stockQty: 0 },
      needs({ burger: [{ ingredientId: "pao", qty: 1 }] }),
      stock({ pao: 0 }),
      noBlock,
    );
    expect(ok).toBe(false);
  });

  it("prato marcado como sem escolha obrigatória sai, mesmo com tudo o resto ok", () => {
    const ok = isItemOrderable(
      { id: "combo", trackStock: false, stockQty: 0 },
      empty,
      stock({}),
      new Set(["combo"]),
    );
    expect(ok).toBe(false);
  });
});

describe("aggregateIngredientNeeds — o que um pedido consome", () => {
  const itemNeeds = needs({
    burger: [{ ingredientId: "pao", qty: 1 }],
    combo: [{ ingredientId: "pao", qty: 1 }],
  });
  const modNeeds = needs({
    bacon: [{ ingredientId: "bacon", qty: 1 }],
    refri: [{ ingredientId: "lata", qty: 1 }],
  });

  it("soma a receita do prato pela quantidade da linha", () => {
    const total = aggregateIngredientNeeds(
      [{ itemId: "burger", qty: 3, modifierIds: [] }],
      itemNeeds,
      modNeeds,
    );
    expect(total.get("pao")).toBe(3);
  });

  it("uma opção conta por cada unidade da linha (2 burgers com bacon = 2 bacons)", () => {
    const total = aggregateIngredientNeeds(
      [{ itemId: "burger", qty: 2, modifierIds: ["bacon"] }],
      itemNeeds,
      modNeeds,
    );
    expect(total.get("pao")).toBe(2);
    expect(total.get("bacon")).toBe(2);
  });

  it("agrega o mesmo ingrediente vindo de artigos diferentes", () => {
    const total = aggregateIngredientNeeds(
      [
        { itemId: "burger", qty: 1, modifierIds: [] },
        { itemId: "combo", qty: 2, modifierIds: ["refri"] },
      ],
      itemNeeds,
      modNeeds,
    );
    expect(total.get("pao")).toBe(1 + 2); // burger + combo×2
    expect(total.get("lata")).toBe(2); // refri escolhido no combo×2
  });

  it("pedido sem receitas não consome nada", () => {
    const total = aggregateIngredientNeeds(
      [{ itemId: "sem_receita", qty: 5, modifierIds: [] }],
      itemNeeds,
      modNeeds,
    );
    expect(total.size).toBe(0);
  });
});
