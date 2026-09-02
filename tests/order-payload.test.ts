import { describe, expect, it } from "vitest";
import { toOrderItemsPayload } from "@/lib/orders/payload";

describe("payload transacional de pedido", () => {
  it("preserva snapshots, notas e extras repetidos", () => {
    const payload = toOrderItemsPayload([
      {
        itemId: "burger",
        name: "Burger",
        unitPriceCents: 1200,
        qty: 2,
        notes: "Sem cebola",
        modifiers: [
          { id: "bacon", name: "Bacon", delta: 150 },
          { id: "bacon", name: "Bacon", delta: 150 },
        ],
      },
    ]);

    expect(payload).toEqual([
      {
        menu_item_id: "burger",
        name_snapshot: "Burger",
        unit_price_cents: 1200,
        qty: 2,
        notes: "Sem cebola",
        modifiers: [
          { modifier_id: "bacon", name_snapshot: "Bacon", price_delta_cents: 150 },
          { modifier_id: "bacon", name_snapshot: "Bacon", price_delta_cents: 150 },
        ],
      },
    ]);
  });

});
