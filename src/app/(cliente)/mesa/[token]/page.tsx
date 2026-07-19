import { notFound } from "next/navigation";
import { resolveTableSession } from "@/lib/session/table";
import { getMenu } from "@/lib/menu";
import { ClienteMenu } from "./ClienteMenu";
import { OrderTracker } from "./OrderTracker";

export default async function MesaPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ pago?: string; cancelado?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const session = await resolveTableSession(token);
  if (!session) notFound();

  const menu = await getMenu(session.establishmentId);

  return (
    <main className="mx-auto max-w-md p-4 pb-40">
      <header className="mb-4">
        <p className="text-sm text-neutral-500">{session.establishmentName}</p>
        <h1 className="text-xl font-medium">{session.tableLabel}</h1>
      </header>

      {sp.pago === "1" && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-900">
          Pagamento recebido. Obrigado!
        </p>
      )}
      {sp.cancelado === "1" && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Pagamento cancelado. Pode tentar de novo.
        </p>
      )}

      <OrderTracker token={token} />

      <ClienteMenu token={token} menu={menu} currency={session.currency} />
    </main>
  );
}
