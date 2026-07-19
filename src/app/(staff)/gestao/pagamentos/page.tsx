import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { refreshConnectStatus } from "@/lib/stripe/connect";
import { startOnboarding, refreshStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; refresh?: string }>;
}) {
  const session = await requireManager();
  const sp = await searchParams;

  // Ao voltar do onboarding (?done) ou refresh, sincroniza o estado real na Stripe.
  const status = await refreshConnectStatus(session.establishmentId);
  const justReturned = sp.done === "1";

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-medium">Pagamentos</h1>
        <Link href="/gestao" className="text-sm text-neutral-500 hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        Ligue a conta Stripe do restaurante. O dinheiro dos clientes vai direto
        para si — a plataforma nunca o retém.
      </p>

      {status.chargesEnabled ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4">
          <p className="font-medium text-green-900">Pagamentos ativos</p>
          <p className="mt-1 text-sm text-green-800">
            Os clientes já podem pagar na mesa. O valor é depositado na conta
            Stripe do restaurante.
          </p>
          <form action={refreshStatus} className="mt-3">
            <button className="rounded-lg border border-green-400 px-3 py-1 text-sm text-green-900">
              Verificar estado
            </button>
          </form>
        </div>
      ) : status.connected ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">Configuração incompleta</p>
          <p className="mt-1 text-sm text-amber-800">
            {justReturned
              ? "Recebemos os dados, mas a Stripe ainda não ativou os pagamentos. Pode faltar informação — continue a configuração."
              : "A conta foi criada mas ainda não pode receber pagamentos. Continue a configuração na Stripe."}
          </p>
          <div className="mt-3 flex gap-2">
            <form action={startOnboarding}>
              <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                Continuar configuração
              </button>
            </form>
            <form action={refreshStatus}>
              <button className="rounded-lg border border-neutral-300 px-4 py-2 text-sm">
                Verificar estado
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="font-medium">Ainda não há pagamentos ligados</p>
          <p className="mt-1 text-sm text-neutral-500">
            Vai ser encaminhado para a Stripe para registar os dados do
            restaurante (NIF, IBAN). Em modo de teste, os dados são simulados.
          </p>
          <form action={startOnboarding} className="mt-3">
            <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
              Ligar pagamentos
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
