// Caminho do dinheiro: o preço de um pedido é SEMPRE recalculado do lado do
// servidor. Estes testes protegem exatamente isso — que o browser não consegue
// impor um preço, colar opções de outro prato, ou saltar escolhas obrigatórias.
import { describe, it, expect } from "vitest";
import {
  prepareOrderLines,
  qtyByItem,
  type PricedItem,
  type PricedGroup,
  type PricedModifier,
  type RequestedLine,
} from "@/lib/pricing";

// --- Fixtures: um menu pequeno mas com os casos que interessam ---
const items = new Map<string, PricedItem>([
  ["burger", { id: "burger", name: "Cheeseburger", priceCents: 850, available: true, trackStock: false, stockQty: 0 }],
  ["combo", { id: "combo", name: "Menu", priceCents: 1200, available: true, trackStock: false, stockQty: 0 }],
  ["agua", { id: "agua", name: "Água", priceCents: 150, available: false, trackStock: false, stockQty: 0 }], // esgotada (manual)
  ["gelado", { id: "gelado", name: "Gelado", priceCents: 300, available: true, trackStock: true, stockQty: 2 }],
]);

const groups: PricedGroup[] = [
  // Extras do burger: opcional (0..N)
  { id: "g_extras", menuItemId: "burger", minSelect: 0, maxSelect: 99 },
  // Bebida do combo: obrigatória (1..1)
  { id: "g_bebida", menuItemId: "combo", minSelect: 1, maxSelect: 1 },
];

const modifiers = new Map<string, PricedModifier>([
  ["bacon", { id: "bacon", groupId: "g_extras", name: "Bacon", priceDeltaCents: 150, available: true }],
  ["ovo", { id: "ovo", groupId: "g_extras", name: "Ovo", priceDeltaCents: 100, available: true }],
  ["indisp", { id: "indisp", groupId: "g_extras", name: "Trufa", priceDeltaCents: 500, available: false }],
  ["refri", { id: "refri", groupId: "g_bebida", name: "Refrigerante", priceDeltaCents: 0, available: true }],
  ["sumo", { id: "sumo", groupId: "g_bebida", name: "Sumo", priceDeltaCents: 50, available: true }],
]);

const prepare = (lines: RequestedLine[]) =>
  prepareOrderLines(lines, items, groups, modifiers);

describe("prepareOrderLines — preço", () => {
  it("usa o preço da BD, ignorando qualquer valor do browser", () => {
    const r = prepare([{ menuItemId: "burger", qty: 1 }]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.subtotalCents).toBe(850);
  });

  it("soma os extras escolhidos ao preço base", () => {
    const r = prepare([{ menuItemId: "burger", qty: 1, modifierIds: ["bacon", "ovo"] }]);
    expect(r.ok && r.lines[0].unitPriceCents).toBe(850 + 150 + 100);
  });

  it("multiplica pela quantidade", () => {
    const r = prepare([{ menuItemId: "burger", qty: 3, modifierIds: ["bacon"] }]);
    // (850 + 150) * 3
    expect(r.ok && r.subtotalCents).toBe(3000);
  });

  it("soma linhas diferentes", () => {
    const r = prepare([
      { menuItemId: "burger", qty: 2 }, // 1700
      { menuItemId: "combo", qty: 1, modifierIds: ["sumo"] }, // 1250
    ]);
    expect(r.ok && r.subtotalCents).toBe(1700 + 1250);
  });
});

describe("prepareOrderLines — validação (defesas do dinheiro)", () => {
  it("recusa artigo desconhecido", () => {
    const r = prepare([{ menuItemId: "fantasma", qty: 1 }]);
    expect(r).toEqual({ ok: false, error: "Item indisponível." });
  });

  it("recusa artigo marcado indisponível (esgotado manual)", () => {
    const r = prepare([{ menuItemId: "agua", qty: 1 }]);
    expect(r).toEqual({ ok: false, error: "Item indisponível." });
  });

  it("recusa quando o pedido excede o stock por prato", () => {
    const r = prepare([{ menuItemId: "gelado", qty: 3 }]); // só há 2
    expect(r.ok).toBe(false);
  });

  it("aceita exatamente o stock disponível", () => {
    const r = prepare([{ menuItemId: "gelado", qty: 2 }]);
    expect(r.ok).toBe(true);
  });

  it("soma várias linhas do mesmo artigo para o teste de stock", () => {
    // 2 + 1 = 3 gelados, mas só há 2 → recusa
    const r = prepare([
      { menuItemId: "gelado", qty: 2 },
      { menuItemId: "gelado", qty: 1, modifierIds: [] },
    ]);
    expect(r.ok).toBe(false);
  });

  it("recusa uma opção indisponível", () => {
    const r = prepare([{ menuItemId: "burger", qty: 1, modifierIds: ["indisp"] }]);
    expect(r).toEqual({ ok: false, error: "Opção inválida." });
  });

  it("recusa colar uma opção que é de OUTRO prato", () => {
    // 'refri' pertence ao grupo do combo, não do burger — não pode entrar aqui.
    const r = prepare([{ menuItemId: "burger", qty: 1, modifierIds: ["refri"] }]);
    expect(r).toEqual({ ok: false, error: "Opção inválida." });
  });

  it("recusa o combo sem a bebida obrigatória", () => {
    const r = prepare([{ menuItemId: "combo", qty: 1 }]);
    expect(r).toEqual({ ok: false, error: "Faltam opções obrigatórias." });
  });

  it("recusa duas bebidas num grupo de escolha única", () => {
    const r = prepare([{ menuItemId: "combo", qty: 1, modifierIds: ["refri", "sumo"] }]);
    expect(r).toEqual({ ok: false, error: "Faltam opções obrigatórias." });
  });

  it("aceita o combo com exatamente uma bebida e cobra o extra dela", () => {
    const r = prepare([{ menuItemId: "combo", qty: 1, modifierIds: ["sumo"] }]);
    expect(r.ok && r.lines[0].unitPriceCents).toBe(1200 + 50);
  });
});

describe("qtyByItem", () => {
  it("soma linhas repetidas do mesmo artigo", () => {
    const q = qtyByItem([
      { menuItemId: "burger", qty: 2 },
      { menuItemId: "burger", qty: 1 },
      { menuItemId: "combo", qty: 1 },
    ]);
    expect(q.get("burger")).toBe(3);
    expect(q.get("combo")).toBe(1);
  });
});
