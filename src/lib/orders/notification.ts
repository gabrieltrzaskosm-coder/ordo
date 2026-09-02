// Texto de notificação de um pedido recém-criado. Mantém a identificação do
// cliente num ponto puro e testável; o React continua a escapar o nome ao
// renderizá-lo no toast.
export function newOrderNotification(customerName: string | null) {
  const name = customerName?.trim();
  return name ? `Novo pedido de ${name}.` : "Novo pedido recebido.";
}
