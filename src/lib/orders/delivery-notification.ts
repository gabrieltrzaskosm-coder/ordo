// A notificação operacional é emitida quando o pedido fica pronto — não quando
// é criado. O garçom precisa do nome e da mesa para fazer a entrega certa.
export function deliveryReadyNotification(
  customerName: string | null,
  tableLabel: string,
) {
  const name = customerName?.trim();
  return name
    ? `${name} · ${tableLabel} pronto para entregar.`
    : `${tableLabel} pronto para entregar.`;
}
