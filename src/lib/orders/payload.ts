// Conversão pura das linhas já validadas/preçadas para o formato enviado à
// transação SQL. Mantém esta fronteira pequena e testável: a base recebe apenas
// snapshots calculados no servidor, nunca valores vindos diretamente do browser.
import type { PreparedLine } from "@/lib/pricing";

export function toOrderItemsPayload(lines: PreparedLine[]) {
  return lines.map((line) => ({
    menu_item_id: line.itemId,
    name_snapshot: line.name,
    unit_price_cents: line.unitPriceCents,
    qty: line.qty,
    notes: line.notes,
    // IDs repetidos são intencionais: dois extras iguais continuam duas linhas
    // de snapshot, exatamente como o preço e a receita já calcularam.
    modifiers: line.modifiers.map((modifier) => ({
      modifier_id: modifier.id,
      name_snapshot: modifier.name,
      price_delta_cents: modifier.delta,
    })),
  }));
}
