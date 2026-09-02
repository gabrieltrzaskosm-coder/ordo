import { describe, expect, it } from "vitest";
import { newOrderNotification } from "@/lib/orders/notification";

describe("notificação de novo pedido", () => {
  it("identifica o cliente que fez o pedido", () => {
    expect(newOrderNotification("  Marina  ")).toBe("Novo pedido de Marina.");
  });

  it("usa uma mensagem segura para pedidos antigos sem nome", () => {
    expect(newOrderNotification(null)).toBe("Novo pedido recebido.");
    expect(newOrderNotification("   ")).toBe("Novo pedido recebido.");
  });
});
