import Link from "next/link";
import { requirePlan } from "@/lib/auth";
import {
  DEFAULT_PERIOD,
  PERIODS,
  getRangeMetrics,
  isPeriod,
  parseDateRange,
  periodRange,
  previousRange,
} from "@/lib/reports";
import { formatMoney } from "@/lib/money";
import { PeriodNav } from "../_components/PeriodNav";
import { pctChange, Trend } from "../_components/Trend";
import { CompareForm } from "../_components/CompareForm";
import { ComparisonResult } from "../_components/ComparisonResult";

export const dynamic = "force-dynamic";

const BASE = "/gestao/insights";

function shortDate(s?: string): string {
  if (!s) return "?";
  const [, m, d] = s.split("-");
  return m && d ? `${d}/${m}` : s;
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePlan("pro");
  const sp = await searchParams;

  const period = isPeriod(sp.p) ? sp.p : DEFAULT_PERIOD;
  const periodLabel = PERIODS.find((p) => p.key === period)!.label;
  const range = periodRange(period);
  const prev = previousRange(range);

  const [m, mPrev] = await Promise.all([
    getRangeMetrics(range.from, range.to),
    getRangeMetrics(prev.from, prev.to),
  ]);

  const aRange = parseDateRange(sp.aFrom, sp.aTo);
  const bRange = parseDateRange(sp.bFrom, sp.bTo);
  const comparison =
    aRange && bRange
      ? {
          a: await getRangeMetrics(aRange.from, aRange.to),
          b: await getRangeMetrics(bRange.from, bRange.to),
        }
      : null;

  const maxQty = Math.max(1, ...m.topItems.map((i) => i.qty));
  const maxHour = Math.max(1, ...m.byHour);
  const hasData = m.orders > 0;

  const cards = [
    {
      label: "Pedidos",
      value: String(m.orders),
      pct: pctChange(m.orders, mPrev.orders),
    },
    {
      label: "Faturado",
      value: formatMoney(m.paidCents),
      pct: pctChange(m.paidCents, mPrev.paidCents),
    },
    {
      label: "Ticket médio",
      value: formatMoney(m.ticketCents),
      pct: pctChange(m.ticketCents, mPrev.ticketCents),
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Insights de negócio</h1>
        <Link href="/gestao" className="text-sm text-muted hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        A variação compara com o período anterior de igual duração.
      </p>

      {/* Seletor de período */}
      <div className="mt-5">
        <PeriodNav basePath={BASE} current={period} />
      </div>

      {/* KPIs do período (com tendência vs. período anterior) */}
      <section className="mt-4 grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted">{c.label}</p>
              {c.pct !== null && <Trend pct={c.pct} />}
            </div>
            <p className="tnum mt-1 text-xl font-semibold text-ink">{c.value}</p>
          </div>
        ))}
      </section>

      {!hasData && (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Sem dados em {periodLabel.toLowerCase()}. Experimente um período maior.
        </p>
      )}

      {/* Mais vendidos */}
      {m.topItems.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">
            Mais vendidos
          </h2>
          <div className="space-y-2.5 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
            {m.topItems.map((it, i) => (
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
      {m.byHour.some((h) => h > 0) && (
        <>
          <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">
            Horas de pico
          </h2>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex h-28 items-end gap-0.5">
              {m.byHour.map((count, h) => (
                <div
                  key={h}
                  className="group relative flex-1"
                  title={`${h}h — ${count} pedido(s)`}
                >
                  <div
                    className="w-full rounded-t bg-brand/80"
                    style={{
                      height: `${(count / maxHour) * 100}%`,
                      minHeight: count > 0 ? "3px" : "0",
                    }}
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

      {/* Comparar períodos */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">
        Comparar períodos
      </h2>
      <CompareForm
        basePath={BASE}
        current={period}
        values={{
          aFrom: sp.aFrom,
          aTo: sp.aTo,
          bFrom: sp.bFrom,
          bTo: sp.bTo,
        }}
      />
      {comparison && (
        <div className="mt-3">
          <ComparisonResult
            a={comparison.a}
            b={comparison.b}
            aLabel={`${shortDate(sp.aFrom)}–${shortDate(sp.aTo)}`}
            bLabel={`${shortDate(sp.bFrom)}–${shortDate(sp.bTo)}`}
          />
        </div>
      )}
    </main>
  );
}
