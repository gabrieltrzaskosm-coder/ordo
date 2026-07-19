// Formatação de valores monetários (armazenados em cêntimos).
export function formatMoney(cents: number, currency = "EUR", locale = "pt-PT") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    cents / 100,
  );
}
