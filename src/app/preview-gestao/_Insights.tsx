// Conteúdo da simulação do Insights (dados fictícios). Ver insights/page.tsx.
import { PeriodNav } from "../(staff)/gestao/_components/PeriodNav";
import { Trend } from "../(staff)/gestao/_components/Trend";
import { CompareForm } from "../(staff)/gestao/_components/CompareForm";
import { DEFAULT_PERIOD } from "@/lib/reports";
import { formatMoney } from "@/lib/money";

const cards = [
  { label: "Pedidos", value: "128", pct: 12 as number | null },
  { label: "Faturado", value: formatMoney(482000), pct: 8 as number | null },
  { label: "Ticket médio", value: formatMoney(3766), pct: 3 as number | null },
];
const topItems = [
  { name: "Spaghetti carbonara", qty: 64 }, { name: "Bruschetta de tomate", qty: 52 },
  { name: "Tiramisù", qty: 41 }, { name: "Caprese", qty: 33 }, { name: "Água com gás", qty: 28 },
];
const maxQty = Math.max(1, ...topItems.map((i) => i.qty));
const byHour = [0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 5, 8, 22, 26, 12, 4, 2, 3, 9, 20, 28, 24, 14, 5];
const maxHour = Math.max(1, ...byHour);

export function InsightsDemo() {
  return (
    <main className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-2xl border border-line bg-surface px-4 py-2.5 text-center text-xs font-semibold text-muted">
        Demonstração · números fictícios (ao vivo, viriam dos pedidos reais)
      </div>
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">Insights</h1>
      <p className="mt-1.5 text-sm text-muted">Padrões de venda · a variação compara com o período anterior de igual duração.</p>
      <div className="mt-5"><PeriodNav basePath="/gestao/insights" current={DEFAULT_PERIOD} /></div>
      <section className="mt-4 grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted">{c.label}</p>
              {c.pct !== null && <Trend pct={c.pct} />}
            </div>
            <p className="tnum mt-1 text-2xl font-extrabold tracking-[-0.02em] text-ink">{c.value}</p>
          </div>
        ))}
      </section>
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Mais vendidos</h2>
      <div className="space-y-2.5 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
        {topItems.map((it, i) => (
          <div key={it.name} className="flex items-center gap-3">
            <span className="tnum w-5 text-right text-sm font-semibold text-muted">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2"><span className="truncate text-sm text-ink">{it.name}</span><span className="tnum shrink-0 text-sm font-semibold text-ink">{it.qty}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full" style={{ width: `${(it.qty / maxQty) * 100}%`, background: "linear-gradient(90deg,#d41d0d,#f0787c)" }} /></div>
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Horas de pico</h2>
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-end gap-0.5">
          {byHour.map((count, h) => (
            <div key={h} className="group flex h-28 flex-1 flex-col justify-end" title={`${h}h — ${count} pedido(s)`}>
              <div className="relative w-full rounded-t" style={{ height: `${(count / maxHour) * 100}%`, minHeight: count > 0 ? "3px" : "0", background: "linear-gradient(180deg,#d41d0d,#f0787c)" }}>
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold text-canvas opacity-0 shadow transition-opacity group-hover:opacity-100">{count}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted"><span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span></div>
      </div>
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Comparar períodos</h2>
      <CompareForm basePath="/gestao/insights" current={DEFAULT_PERIOD} values={{}} />
    </main>
  );
}
