import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveTableSession, getBestSellerItemId } from "@/lib/session/table";
import { getMenu } from "@/lib/menu";
import { hasFeature } from "@/lib/plans";
import { ClienteMenu } from "./ClienteMenu";
import { OrderTracker } from "./OrderTracker";
import { MenuNav } from "./MenuNav";

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

  // Destaque do mais pedido — só no plano Max (feature "ia"/divulgação).
  const bestSellerId = hasFeature(session.plan, "ia")
    ? await getBestSellerItemId(session.establishmentId)
    : null;

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-ink">
              {session.establishmentName}
            </p>
            <p className="text-xs text-muted">Peça pelo celular · pague na mesa</p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-weak px-3 py-1 text-xs font-semibold text-brand-strong">
            {session.tableLabel}
          </span>
        </div>
        <MenuNav categories={menu} />
      </header>

      <main className="mx-auto max-w-md px-4 pb-44 pt-4">
        {sp.pago === "1" && (
          <p className="mb-4 rounded-2xl bg-success-weak px-4 py-3 text-sm font-medium text-success">
            Pagamento recebido. Bom apetite!
          </p>
        )}
        {sp.cancelado === "1" && (
          <p className="mb-4 rounded-2xl bg-warn-weak px-4 py-3 text-sm font-medium text-warn">
            Pagamento cancelado. Pode tentar de novo.
          </p>
        )}

        <OrderTracker token={token} />

        <ClienteMenu
          token={token}
          menu={menu}
          currency={session.currency}
          bestSellerId={bestSellerId}
        />

        <footer className="mt-8 text-center">
          <Link
            href="/privacidade"
            className="text-xs text-muted underline hover:text-ink"
          >
            Privacidade e LGPD
          </Link>
        </footer>
      </main>
    </div>
  );
}
