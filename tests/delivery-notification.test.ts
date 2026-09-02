import { describe, expect, it } from "vitest";
import { deliveryReadyNotification } from "@/lib/orders/delivery-notification";

describe("notificação de pedido pronto para entrega", () => {
  it("identifica o cliente e a mesa no momento da entrega", () => {
    expect(deliveryReadyNotification("  Marina  ", "Mesa 4")).toBe(
      "Marina · Mesa 4 pronto para entregar.",
    );
  });

  it("mantém a mesa para pedidos antigos sem nome", () => {
    expect(deliveryReadyNotification(null, "Mesa 4")).toBe(
      "Mesa 4 pronto para entregar.",
    );
  });
});
