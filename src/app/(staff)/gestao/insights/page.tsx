import Link from "next/link";
import { requirePlan } from "@/lib/auth";
import { getInsights } from "@/lib/reports";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

function pctChange(now: number, prev: number): number | null {
  if (prev === 0) return now === 0 ? 0 : null; // sem base de comparação
  return Math.round(((now - prev) / prev) * 100);
}

function Trend({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted">novo</span>;
  const up = pct >= 0;
  return (
    <span
      className={`text-xs font-semibold ${up ? "text-success" : "text-warn"}`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

export default async function InsightsPage() {
  await requirePlan("pro");
  const { topItems, byHour, thisWeek, lastWeek } = await getInsights();

  const maxQty = Math.max(1, ...topItems.map((i) => i.qty));
  const maxHour = Math.max(1, ...byHour);
  const hasData = topItems.length > 0 || byHour.some((h) => h > 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Insights de negócio</h1>
        <Link href="/gestao" className="text-sm text-muted hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">Últimos 30 dias.</p>

      {!hasData && (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Ainda não há dados suficientes. Volte quando tiver alguns pedidos.
        </p>
      )}

      {/* Tendência semanal */}
      <section className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">Pedidos (7 dias)</p>
            <Trend pct={pctChange(thisWeek.orders, lastWeek.orders)} />
          </div>
          <p className="tnum mt-1 text-xl font-semibold text-ink">
            {thisWeek.orders}
          </p>
          <p className="text-xs text-muted">
            semana anterior: {lastWeek.orders}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">Faturado (7 dias)</p>
            <Trend pct={pctChange(thisWeek.paidCents, lastWeek.paidCents)} />
          </div>
          <p className="tnum mt-1 text-xl font-semibold text-ink">
            {formatMoney(thisWeek.paidCents)}
          </p>
          <p className="text-xs text-muted">
            semana anterior: {formatMoney(lastWeek.paidCents)}
          </p>
        </div>
      </section>

      {/* Mais vendidos */}
      {topItems.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">
            Mais vendidos
          </h2>
          <div className="space-y-2.5 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
            {topItems.map((it, i) => (
              <div key={it.name} className="flex items-center gap-3">
                <span className="tnum w-5 text-right text-sm font-semibold text-muted">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-ink">{it.name}</span>
                    <span className="tnum shrink-0 text-sm font-semibold text-ink">
                      {it.qty}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(it.qty / maxQty) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Horas de pico */}
      {byHour.some((h) => h > 0) && (
        <>
          <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">
            Horas de pico
          </h2>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex h-28 items-end gap-0.5">
              {byHour.map((count, h) => (
                <div
                  key={h}
                  className="group relative flex-1"
                  title={`${h}h — ${count} pedido(s)`}
                >
                  <div
                    className="w-full rounded-t bg-brand/80"
                    style={{ height: `${(count / maxHour) * 100}%`, minHeight: count > 0 ? "3px" : "0" }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-muted">
              <span>00h</span>
              <span>06h</span>
              <span>12h</span>
              <span>18h</span>
              <span>23h</span>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
