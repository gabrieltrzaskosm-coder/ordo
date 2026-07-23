// Variação percentual entre dois valores, com seta e cor. Partilhado pelas
// páginas de análise. `null` = sem base de comparação (período anterior a zero).
export function pctChange(now: number, prev: number): number | null {
  if (prev === 0) return now === 0 ? 0 : null;
  return Math.round(((now - prev) / prev) * 100);
}

export function Trend({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted">novo</span>;
  const up = pct >= 0;
  return (
    <span className={`text-xs font-semibold ${up ? "text-success" : "text-warn"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}
