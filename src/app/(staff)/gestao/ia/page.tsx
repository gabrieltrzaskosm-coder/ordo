import { requirePlan } from "@/lib/auth";
import { getPredictionSnapshot } from "@/lib/predictions";
import { AssistantClient } from "./AssistantClient";

export const dynamic = "force-dynamic";

export default async function IaPage() {
  await requirePlan("max");
  const { forecast, alerts, ingredients } = await getPredictionSnapshot();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
        Ordo IA
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Insights automáticos a partir dos dados do restaurante. A qualidade
        melhora à medida que há mais histórico.
      </p>

      {/* Resumo (LLM) */}
      <div className="mt-6">
        <AssistantClient />
      </div>

      {/* Alerta preditivo de stock */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">
        Alerta de estoque
      </h2>
      {alerts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Sem alertas. Ligue o estoque de itens em Controle de estoque, ou crie
          ingredientes com receita, para receber previsões de ruptura.
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={`${a.kind}-${a.name}`}
              className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-sm ${
                a.etaDays < 1
                  ? "border-warn/30 bg-warn-weak text-warn"
                  : "border-line bg-surface text-ink"
              }`}
            >
              <span>{a.message}</span>
              <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                {a.kind}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Previsão de procura */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">
        Previsão de procura
      </h2>
      {forecast.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Ainda não há vendas suficientes para prever a procura.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Artigo</th>
                <th className="px-4 py-2.5 text-right font-medium">Média/dia</th>
                <th className="px-4 py-2.5 text-right font-medium">
                  Preparar ~
                </th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((f) => (
                <tr key={f.name} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-ink">{f.name}</td>
                  <td className="tnum px-4 py-2.5 text-right text-muted">
                    {f.perDay.toFixed(1)}
                  </td>
                  <td className="tnum px-4 py-2.5 text-right font-semibold text-ink">
                    {f.suggested}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Consumo de ingredientes (o lado das compras) */}
      {ingredients.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">
            Ingredientes a repor
          </h2>
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
                    <td className="tnum px-4 py-2.5 text-right text-muted">
                      {f.perDay.toFixed(1)}
                    </td>
                    <td className="tnum px-4 py-2.5 text-right text-muted">
                      {f.stockQty}
                    </td>
                    <td
                      className={`tnum px-4 py-2.5 text-right font-semibold ${
                        f.toBuy > 0 ? "text-ink" : "text-muted"
                      }`}
                    >
                      {f.toBuy > 0 ? f.toBuy : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 px-1 text-xs text-muted">
            Quanto falta para aguentar mais uma semana ao ritmo dos últimos 14
            dias.
          </p>
        </>
      )}

      <p className="mt-6 px-1 text-xs text-muted">
        Estimativas com base nos últimos 14 dias. Indicativas — ajuste ao seu
        conhecimento do negócio.
      </p>
    </main>
  );
}
