import Link from "next/link";
import { requirePlan } from "@/lib/auth";
import { getFinanceReport } from "@/lib/reports";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

function monthLabel(): string {
  return new Intl.DateTimeFormat("pt-PT", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso + "T12:00:00"));
}

export default async function FinanceiroPage() {
  await requirePlan("pro");
  const { today, month, daily } = await getFinanceReport();

  const todayCards = [
    { label: "Pedidos hoje", value: String(today.orders) },
    { label: "Faturado (pago)", value: formatMoney(today.paidCents) },
    { label: "Em aberto", value: formatMoney(today.openCents) },
    { label: "Gorjetas", value: formatMoney(today.tipsCents) },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Balanço financeiro</h1>
        <Link href="/gestao" className="text-sm text-muted hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Faturado = pedidos já pagos. Em aberto = servidos mas por cobrar.
      </p>

      {/* Hoje */}
      <h2 className="mt-6 mb-3 text-sm font-semibold text-ink">Hoje</h2>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {todayCards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
          >
            <p className="text-xs text-muted">{c.label}</p>
            <p className="tnum mt-1 text-lg font-semibold text-ink">{c.value}</p>
          </div>
        ))}
      </section>

      {/* Mês */}
      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold capitalize text-ink">
          {monthLabel()}
        </h2>
        <a
          href="/gestao/financeiro/export"
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand/40"
        >
          Exportar CSV
        </a>
      </div>
      <section className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="px-4 py-5">
          <p className="text-xs text-muted">Pedidos</p>
          <p className="tnum mt-1 text-xl font-semibold text-ink">{month.orders}</p>
        </div>
        <div className="px-4 py-5">
          <p className="text-xs text-muted">Faturado</p>
          <p className="tnum mt-1 text-xl font-semibold text-ink">
            {formatMoney(month.paidCents)}
          </p>
        </div>
        <div className="px-4 py-5">
          <p className="text-xs text-muted">Ticket médio</p>
          <p className="tnum mt-1 text-xl font-semibold text-ink">
            {formatMoney(month.ticketCents)}
          </p>
        </div>
      </section>

      {/* Detalhe diário */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Por dia</h2>
      {daily.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Ainda não há pedidos este mês.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Dia</th>
                <th className="px-4 py-2.5 text-right font-medium">Pedidos</th>
                <th className="px-4 py-2.5 text-right font-medium">Faturado</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d) => (
                <tr key={d.day} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 capitalize text-ink">
                    {dayLabel(d.day)}
                  </td>
                  <td className="tnum px-4 py-2.5 text-right text-ink">
                    {d.orders}
                  </td>
                  <td className="tnum px-4 py-2.5 text-right font-medium text-ink">
                    {formatMoney(d.paidCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
