// Conteúdo da simulação do Financeiro (dados fictícios). Ver page.tsx.
import { PeriodNav } from "../(staff)/gestao/_components/PeriodNav";
import { Trend } from "../(staff)/gestao/_components/Trend";
import { CompareForm } from "../(staff)/gestao/_components/CompareForm";
import { DEFAULT_PERIOD } from "@/lib/reports";
import { formatMoney } from "@/lib/money";

function bucketLabel(bucket: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(bucket + "T12:00:00"));
}
const chartLabel = (b: string) => b.split("-")[2] ?? b;

const raw: [string, number, number][] = [
  ["2026-08-04", 14, 52000], ["2026-08-05", 19, 71000], ["2026-08-06", 11, 41000],
  ["2026-08-07", 22, 86000], ["2026-08-08", 26, 98000], ["2026-08-09", 20, 74000], ["2026-08-10", 16, 60000],
];
const chart = raw.map(([bucket, orders, paidCents]) => ({ bucket, orders, paidCents }));
const series = [...chart].reverse();
const maxPaid = Math.max(1, ...chart.map((d) => d.paidCents));

const cards = [
  { label: "Pedidos", value: "128", pct: 12 as number | null },
  { label: "Faturado", value: formatMoney(482000), pct: 8 as number | null },
  { label: "Em aberto", value: formatMoney(34000), pct: null as number | null },
  { label: "Ticket médio", value: formatMoney(3766), pct: 3 as number | null },
  { label: "Gorjetas", value: formatMoney(0), pct: null as number | null },
];

export function FinanceiroDemo() {
  return (
    <main className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-2xl border border-line bg-surface px-4 py-2.5 text-center text-xs font-semibold text-muted">
        Demonstração · números fictícios (ao vivo, viriam dos pedidos reais)
      </div>
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">Financeiro</h1>
      <p className="mt-1.5 text-sm text-muted">Faturado = pedidos já pagos. Em aberto = servidos mas por cobrar.</p>
      <div className="mt-5"><PeriodNav basePath="/gestao/financeiro" current={DEFAULT_PERIOD} /></div>
      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted">{c.label}</p>
              {c.pct !== null && <Trend pct={c.pct} />}
            </div>
            <p className="tnum mt-1 text-lg font-extrabold tracking-[-0.01em] text-ink">{c.value}</p>
          </div>
        ))}
      </section>
      <div className="mt-4 rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
        <p className="mb-4 text-sm font-bold text-ink">Faturado por dia</p>
        <div className="flex items-end gap-2">
          {chart.map((d) => (
            <div key={d.bucket} className="group flex h-40 flex-1 flex-col justify-end" title={`${bucketLabel(d.bucket)} · ${formatMoney(d.paidCents)}`}>
              <div className="relative w-full rounded-t-lg" style={{ height: `${(d.paidCents / maxPaid) * 100}%`, minHeight: "4px", background: "linear-gradient(180deg,#d41d0d,#f0787c)" }}>
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold text-canvas opacity-0 shadow transition-opacity group-hover:opacity-100">{formatMoney(d.paidCents)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">{chart.map((d) => (<div key={d.bucket} className="flex-1 text-center text-[10px] font-medium text-muted">{chartLabel(d.bucket)}</div>))}</div>
      </div>
      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Por dia</h2>
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink">Exportar CSV</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs text-muted"><th className="px-4 py-2.5 font-medium">Dia</th><th className="px-4 py-2.5 text-right font-medium">Pedidos</th><th className="px-4 py-2.5 text-right font-medium">Faturado</th></tr></thead>
          <tbody>
            {series.map((d) => (
              <tr key={d.bucket} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 capitalize text-ink">{bucketLabel(d.bucket)}</td>
                <td className="tnum px-4 py-2.5 text-right text-ink">{d.orders}</td>
                <td className="tnum px-4 py-2.5 text-right font-medium text-ink">{formatMoney(d.paidCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Comparar períodos</h2>
      <CompareForm basePath="/gestao/financeiro" current={DEFAULT_PERIOD} values={{}} />
    </main>
  );
}
