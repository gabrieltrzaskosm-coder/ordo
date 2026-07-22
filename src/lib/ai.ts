// Resumo inteligente do dia (plano Max) — a única feature de IA a sério.
// Usa a API do Claude sobre dados AGREGADOS (sem PII de clientes). A chave é da
// plataforma (serverEnv.anthropicApiKey), não por restaurante.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env";
import { getFinanceReport, getInsights } from "@/lib/reports";
import { formatMoney } from "@/lib/money";

export type SummaryResult =
  | { ok: true; text: string }
  | { ok: false; reason: "no_key" | "error"; error?: string };

export async function generateDailySummary(): Promise<SummaryResult> {
  const apiKey = serverEnv.anthropicApiKey();
  if (!apiKey) return { ok: false, reason: "no_key" };

  const [finance, insights] = await Promise.all([
    getFinanceReport(),
    getInsights(),
  ]);

  // Números agregados, em texto compacto, para o modelo resumir.
  const top = insights.topItems
    .slice(0, 5)
    .map((i) => `${i.name} (${i.qty})`)
    .join(", ");
  const dados = [
    `Hoje: ${finance.today.orders} pedidos, ${formatMoney(finance.today.paidCents)} faturado, ${formatMoney(finance.today.tipsCents)} em gorjetas, ${formatMoney(finance.today.openCents)} por cobrar.`,
    `Mês: ${finance.month.orders} pedidos, ${formatMoney(finance.month.paidCents)} faturado, ticket médio ${formatMoney(finance.month.ticketCents)}.`,
    `Semana: ${insights.thisWeek.orders} pedidos (${formatMoney(insights.thisWeek.paidCents)}) vs ${insights.lastWeek.orders} (${formatMoney(insights.lastWeek.paidCents)}) na anterior.`,
    `Mais vendidos (30 dias): ${top || "sem dados"}.`,
  ].join("\n");

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system:
        "És um analista de restauração. Escreves em português de Portugal, " +
        "claro e direto, para o dono de um restaurante. Resume o dia em 3 a 5 " +
        "frases: o que correu bem, o que merece atenção e uma sugestão prática. " +
        "Sem preâmbulo, sem markdown, sem títulos — só o texto do resumo. Não " +
        "inventes números além dos fornecidos.",
      messages: [{ role: "user", content: dados }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) return { ok: false, reason: "error" };
    return { ok: true, text };
  } catch (e) {
    // O detalhe (ex.: saldo/limite da conta da plataforma) fica no log do
    // servidor; ao dono do restaurante mostramos só uma mensagem genérica —
    // não deve ver internals da API da plataforma.
    console.error("[ai] resumo falhou:", e instanceof Error ? e.message : e);
    return { ok: false, reason: "error" };
  }
}
