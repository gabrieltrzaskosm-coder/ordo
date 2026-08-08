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

const BASE = "/gestao/financeiro";

function bucketLabel(bucket: string): string {
  // "YYYY-MM" (mensal) ou "YYYY-MM-DD" (diário).
  if (bucket.length === 7) {
    return new Intl.DateTimeFormat("pt-PT", {
      month: "long",
      year: "numeric",
    }).format(new Date(bucket + "-01T12:00:00"));
  }
  return new Intl.DateTimeFormat("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(bucket + "T12:00:00"));
}

/** "2026-07-01" → "01/07". Para rótulos da comparação. */
function shortDate(s?: string): string {
  if (!s) return "?";
  const [, m, d] = s.split("-");
  return m && d ? `${d}/${m}` : s;
}

/** Rótulo curto para as barras: "07" (dia) ou "jul" (mês). */
function chartLabel(bucket: string): string {
  if (bucket.length === 7) {
    return new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(new Date(bucket + "-01T12:00:00"))
      .replace(".", "");
  }
  return bucket.split("-")[2] ?? bucket;
}

export default async function FinanceiroPage({
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

  // Comparação custom (ambos os intervalos têm de estar completos e válidos).
  const aRange = parseDateRange(sp.aFrom, sp.aTo);
  const bRange = parseDateRange(sp.bFrom, sp.bTo);
  const comparison =
    aRange && bRange
      ? {
          a: await getRangeMetrics(aRange.from, aRange.to),
          b: await getRangeMetrics(bRange.from, bRange.to),
        }
      : null;

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
      label: "Em aberto",
      value: formatMoney(m.openCents),
      pct: null,
    },
    {
      label: "Ticket médio",
      value: formatMoney(m.ticketCents),
      pct: pctChange(m.ticketCents, mPrev.ticketCents),
    },
    {
      label: "Gorjetas",
      value: formatMoney(m.tipsCents),
      pct: pctChange(m.tipsCents, mPrev.tipsCents),
    },
  ];

  const series = [...m.series].reverse(); // mais recente primeiro
  const chart = m.series; // cronológico (antigo → recente), para as barras
  const maxPaid = Math.max(1, ...chart.map((d) => d.paidCents));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
        Financeiro
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Faturado = pedidos já pagos. Em aberto = servidos mas por cobrar. A
        variação compara com o período anterior de igual duração.
      </p>

      {/* Seletor de período */}
      <div className="mt-5">
        <PeriodNav basePath={BASE} current={period} />
      </div>

      {/* KPIs do período */}
      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted">{c.label}</p>
              {c.pct !== null && <Trend pct={c.pct} />}
            </div>
            <p className="tnum mt-1 text-lg font-extrabold tracking-[-0.01em] text-ink">
              {c.value}
            </p>
          </div>
        ))}
      </section>

      {/* Gráfico de tendência (barras gradiente) */}
      {chart.length > 0 && (
        <div className="mt-4 rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <p className="mb-4 text-sm font-bold text-ink">
            Faturado {m.granularity === "month" ? "por mês" : "por dia"}
          </p>
          <div className="flex items-end gap-2">
            {chart.map((d) => (
              <div
                key={d.bucket}
                className="flex h-40 flex-1 flex-col justify-end"
                title={`${bucketLabel(d.bucket)} · ${formatMoney(d.paidCents)}`}
              >
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${(d.paidCents / maxPaid) * 100}%`,
                    minHeight: d.paidCents > 0 ? "4px" : "0",
                    background: "linear-gradient(180deg,#d41d0d,#f0787c)",
                  }}
                />
              </div>
            ))}
          </div>
          {chart.length <= 16 && (
            <div className="mt-2 flex gap-2">
              {chart.map((d) => (
                <div
                  key={d.bucket}
                  className="flex-1 text-center text-[10px] font-medium text-muted"
                >
                  {chartLabel(d.bucket)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detalhe da série */}
      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          {m.granularity === "month" ? "Por mês" : "Por dia"}
        </h2>
        <a
          href={`${BASE}/export?p=${period}`}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand/40"
        >
          Exportar CSV
        </a>
      </div>
      {series.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Sem pedidos em {periodLabel.toLowerCase()}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {m.granularity === "month" ? "Mês" : "Dia"}
                </th>
                <th className="px-4 py-2.5 text-right font-medium">Pedidos</th>
                <th className="px-4 py-2.5 text-right font-medium">Faturado</th>
              </tr>
            </thead>
            <tbody>
              {series.map((d) => (
                <tr key={d.bucket} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 capitalize text-ink">
                    {bucketLabel(d.bucket)}
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
