// Formatação de valores monetários (armazenados em centavos).
export function formatMoney(cents: number, currency = "BRL", locale = "pt-BR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    cents / 100,
  );
}
