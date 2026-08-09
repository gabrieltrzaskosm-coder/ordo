// Conteúdo da simulação do Ordo IA (dados fictícios). Ver ia/page.tsx.
// O resumo (LLM) é mostrado já "gerado", no cartão gradiente.

const summary =
  "O dia começou 18% acima da média das segundas. As entradas puxaram o ticket " +
  "médio para cima e a cozinha manteve o tempo de preparo abaixo de 12 min. O " +
  "movimento deve concentrar-se entre 20h e 21h30 — vale reforçar o salão a " +
  "partir das 19h30. Fique de olho na muçarela, que deve acabar em ~2 dias no " +
  "ritmo atual.";

const alerts = [
  { kind: "ingrediente", name: "Muçarela", message: "A muçarela deve acabar em ~2 dias no ritmo atual.", etaDays: 2 },
  { kind: "artigo", name: "Tiramisù", message: "O Tiramisù pode esgotar ainda hoje.", etaDays: 0.5 },
];
const forecast = [
  { name: "Spaghetti carbonara", perDay: 12.3, suggested: 14 },
  { name: "Bruschetta de tomate", perDay: 9.1, suggested: 11 },
  { name: "Tiramisù", perDay: 6.4, suggested: 8 },
  { name: "Caprese", perDay: 4.8, suggested: 6 },
];
const ingredients = [
  { name: "Muçarela", perDay: 3.2, stockQty: 6, toBuy: 16 },
  { name: "Azeite extra-virgem", perDay: 0.8, stockQty: 3, toBuy: 3 },
  { name: "Tomate pelado", perDay: 2.1, stockQty: 28, toBuy: 0 },
  { name: "Farinha 00", perDay: 4.5, stockQty: 42, toBuy: 0 },
];

export function OrdoIaDemo() {
  return (
    <main className="mx-auto max-w-2xl">
      <div className="mb-6 rounded-2xl border border-line bg-surface px-4 py-2.5 text-center text-xs font-semibold text-muted">
        Demonstração · números fictícios (ao vivo, viriam dos pedidos reais)
      </div>
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">Ordo IA</h1>
      <p className="mt-1.5 text-sm text-muted">
        Insights automáticos a partir dos dados do restaurante. A qualidade melhora à medida que há mais histórico.
      </p>

      {/* Resumo (LLM) — mostrado já gerado */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
          <div>
            <p className="font-bold text-ink">Resumo inteligente do dia</p>
            <p className="text-sm text-muted">Uma leitura do dia em linguagem natural, a partir dos seus números.</p>
          </div>
          <button className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink">Gerar de novo</button>
        </div>
        <div className="mt-4 rounded-[22px] p-6 text-white shadow-[0_18px_40px_-20px_rgba(212,29,13,.55)]" style={{ background: "linear-gradient(135deg, #d41d0d, #b01808)" }}>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.05em] text-white/80">Resumo de performance</p>
          <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed">{summary}</p>
        </div>
      </div>

      {/* Alerta preditivo de estoque */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Alerta de estoque</h2>
      <ul className="space-y-2">
        {alerts.map((a) => (
          <li
            key={`${a.kind}-${a.name}`}
            className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-sm ${a.etaDays < 1 ? "border-warn/30 bg-warn-weak text-warn" : "border-line bg-surface text-ink"}`}
          >
            <span>{a.message}</span>
            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">{a.kind}</span>
          </li>
        ))}
      </ul>

      {/* Previsão de procura */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Previsão de procura</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">Artigo</th>
              <th className="px-4 py-2.5 text-right font-medium">Média/dia</th>
              <th className="px-4 py-2.5 text-right font-medium">Preparar ~</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((f) => (
              <tr key={f.name} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink">{f.name}</td>
                <td className="tnum px-4 py-2.5 text-right text-muted">{f.perDay.toFixed(1)}</td>
                <td className="tnum px-4 py-2.5 text-right font-semibold text-ink">{f.suggested}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ingredientes a repor */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Ingredientes a repor</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">Ingrediente</th>
              <th className="px-4 py-2.5 text-right font-medium">Gasta/dia</th>
              <th className="px-4 py-2.5 text-right font-medium">Em estoque</th>
              <th className="px-4 py-2.5 text-right font-medium">Comprar ~</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((f) => (
              <tr key={f.name} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink">{f.name}</td>
                <td className="tnum px-4 py-2.5 text-right text-muted">{f.perDay.toFixed(1)}</td>
                <td className="tnum px-4 py-2.5 text-right text-muted">{f.stockQty}</td>
                <td className={`tnum px-4 py-2.5 text-right font-semibold ${f.toBuy > 0 ? "text-ink" : "text-muted"}`}>{f.toBuy > 0 ? f.toBuy : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 px-1 text-xs text-muted">Quanto falta para aguentar mais uma semana ao ritmo dos últimos 14 dias.</p>

      <p className="mt-6 px-1 text-xs text-muted">Estimativas com base nos últimos 14 dias. Indicativas — ajuste ao seu conhecimento do negócio.</p>
    </main>
  );
}
