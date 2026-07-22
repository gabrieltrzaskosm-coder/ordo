import Link from "next/link";
import { requirePlan } from "@/lib/auth";
import { getDemandForecast, getStockAlerts } from "@/lib/predictions";
import { AssistantClient } from "./AssistantClient";

export const dynamic = "force-dynamic";

export default async function IaPage() {
  await requirePlan("max");
  const [forecast, alerts] = await Promise.all([
    getDemandForecast(),
    getStockAlerts(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Assistente IA</h1>
        <Link href="/gestao" className="text-sm text-muted hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Insights automáticos a partir dos dados do restaurante. A qualidade
        melhora à medida que há mais histórico.
      </p>

      {/* Resumo (LLM) */}
      <div className="mt-6">
        <AssistantClient />
      </div>

      {/* Alerta preditivo de stock */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">
        Alerta de stock
      </h2>
      {alerts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Sem alertas. Ligue o stock de alguns artigos em Gestão de stock para
          receber previsões de rutura.
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={a.name}
              className={`rounded-2xl border p-3.5 text-sm ${
                a.etaDays < 1
                  ? "border-warn/30 bg-warn-weak text-warn"
                  : "border-line bg-surface text-ink"
              }`}
            >
              {a.message}
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
      <p className="mt-2 px-1 text-xs text-muted">
        Estimativas com base nos últimos 14 dias. Indicativas — ajuste ao seu
        conhecimento do negócio.
      </p>
    </main>
  );
}
