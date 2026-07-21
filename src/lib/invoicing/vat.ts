// Códigos de IVA usados no menu e na faturação. O código é o que o fornecedor
// certificado (Vendus) espera; a percentagem é só indicativa (Continente) para
// mostrar ao gestor — a taxa real é resolvida pela região fiscal da conta.
export type VatCode = "NOR" | "INT" | "RED" | "ISE";

export const VAT_LABELS: Record<VatCode, string> = {
  NOR: "Normal (23%)",
  INT: "Intermédia (13%)",
  RED: "Reduzida (6%)",
  ISE: "Isento",
};

export const VAT_CODES: readonly VatCode[] = ["NOR", "INT", "RED", "ISE"];

export function isVatCode(v: unknown): v is VatCode {
  return typeof v === "string" && (VAT_CODES as readonly string[]).includes(v);
}
