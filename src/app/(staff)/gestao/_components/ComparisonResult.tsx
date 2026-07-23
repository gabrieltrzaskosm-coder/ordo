// Resultado da comparação de dois períodos: métricas de A e B lado a lado, com
// a variação de B face a A. Partilhado pelas páginas de análise.
import type { RangeMetrics } from "@/lib/reports";
import { formatMoney } from "@/lib/money";
import { pctChange, Trend } from "./Trend";

type Row = { label: string; a: string; b: string; pct: number | null };

function buildRows(a: RangeMetrics, b: RangeMetrics): Row[] {
  return [
    {
      label: "Pedidos",
      a: String(a.orders),
      b: String(b.orders),
      pct: pctChange(b.orders, a.orders),
    },
    {
      label: "Faturado",
      a: formatMoney(a.paidCents),
      b: formatMoney(b.paidCents),
      pct: pctChange(b.paidCents, a.paidCents),
    },
    {
      label: "Ticket médio",
      a: formatMoney(a.ticketCents),
      b: formatMoney(b.ticketCents),
      pct: pctChange(b.ticketCents, a.ticketCents),
    },
    {
      label: "Gorjetas",
      a: formatMoney(a.tipsCents),
      b: formatMoney(b.tipsCents),
      pct: pctChange(b.tipsCents, a.tipsCents),
    },
  ];
}

export function ComparisonResult({
  a,
  b,
  aLabel,
  bLabel,
}: {
  a: RangeMetrics;
  b: RangeMetrics;
  aLabel: string;
  bLabel: string;
}) {
  const rows = buildRows(a, b);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="px-4 py-2.5 font-medium"> </th>
            <th className="px-4 py-2.5 text-right font-medium">A · {aLabel}</th>
            <th className="px-4 py-2.5 text-right font-medium">B · {bLabel}</th>
            <th className="px-4 py-2.5 text-right font-medium">Variação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-line last:border-0">
              <td className="px-4 py-2.5 text-ink">{r.label}</td>
              <td className="tnum px-4 py-2.5 text-right text-ink">{r.a}</td>
              <td className="tnum px-4 py-2.5 text-right font-medium text-ink">
                {r.b}
              </td>
              <td className="px-4 py-2.5 text-right">
                <Trend pct={r.pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
