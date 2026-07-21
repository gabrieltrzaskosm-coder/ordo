import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function GestaoPage() {
  const session = await requireManager();
  const supabase = await createClient();

  // Resumo do dia a partir de `orders`. Nota: enquanto o pagamento não estiver
  // implementado, isto é valor PEDIDO, não valor cobrado — ver aviso abaixo.
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const { data: hoje } = await supabase
    .from("orders")
    .select("total_cents, status")
    .gte("created_at", inicioDoDia.toISOString());

  const validos = (hoje ?? []).filter((o) => o.status !== "cancelled");
  const totalCents = validos.reduce((s, o) => s + o.total_cents, 0);
  const ticketMedio = validos.length ? Math.round(totalCents / validos.length) : 0;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-medium">Gestão · {session.establishmentName}</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">
        Menu, mesas e resultados do estabelecimento.
      </p>

      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Pedidos hoje</p>
          <p className="text-2xl font-medium">{validos.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Valor pedido hoje</p>
          <p className="text-2xl font-medium">{formatMoney(totalCents)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Ticket médio</p>
          <p className="text-2xl font-medium">{formatMoney(ticketMedio)}</p>
        </div>
      </section>

      <p className="mb-8 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        Estes números refletem o valor <strong>pedido</strong> (todos os pedidos
        do dia), não apenas o já cobrado.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/gestao/menu"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
        >
          <p className="font-medium">Menu</p>
          <p className="text-sm text-neutral-500">
            Categorias, pratos, preços e disponibilidade.
          </p>
        </Link>
        <Link
          href="/gestao/mesas"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
        >
          <p className="font-medium">Mesas & QR codes</p>
          <p className="text-sm text-neutral-500">
            Criar mesas, gerar e imprimir códigos.
          </p>
        </Link>
        <Link
          href="/gestao/equipa"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
        >
          <p className="font-medium">Equipa</p>
          <p className="text-sm text-neutral-500">
            Contas de cozinha, atendimento e gestão.
          </p>
        </Link>
        <Link
          href="/gestao/pagamentos"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
        >
          <p className="font-medium">Pagamentos</p>
          <p className="text-sm text-neutral-500">
            Ligar a conta Stripe para receber na mesa.
          </p>
        </Link>
        <Link
          href="/gestao/faturacao"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
        >
          <p className="font-medium">Faturação</p>
          <p className="text-sm text-neutral-500">
            Ligar o Vendus para emitir a fatura-recibo (AT).
          </p>
        </Link>
      </div>
    </main>
  );
}
