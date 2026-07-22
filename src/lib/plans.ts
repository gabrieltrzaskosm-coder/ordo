// Fonte única da verdade dos planos e do que cada um desbloqueia (entitlements).
//
// Gating ≠ cobrança: aqui só se decide "este plano tem acesso a X". Quem cobra
// és tu, à mão, definindo `establishments.plan`. O billing automático (Stripe)
// fica para uma fase futura.
//
// Adicionar valor a um plano = adicionar uma feature abaixo e atribuir o nível
// mínimo. O resto (bloqueios no servidor + UI) herda daqui.
import type { Database } from "@/lib/supabase/database.types";

export type Plan = Database["public"]["Enums"]["plan_tier"]; // "basic" | "pro" | "max"

// Ordem crescente. O índice serve de "rank" para comparar planos.
export const PLAN_ORDER: readonly Plan[] = ["basic", "pro", "max"];

export function planRank(plan: Plan): number {
  const i = PLAN_ORDER.indexOf(plan);
  return i === -1 ? 0 : i;
}

/** Chaves de funcionalidade sujeitas a plano. */
export type Feature =
  | "financeiro" // balanço diário/mensal
  | "insights" // horas de pico, ticket médio, tendências, mais vendidos
  | "stock" // gestão de stock + baixa automática
  | "ia"; // resumo, previsão, destaque, alerta preditivo

// Plano MÍNIMO que desbloqueia cada funcionalidade.
export const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  financeiro: "pro",
  insights: "pro",
  stock: "max",
  ia: "max",
};

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return planRank(plan) >= planRank(FEATURE_MIN_PLAN[feature]);
}

// ---------- Apresentação (página do plano / upsell) ----------

export const PLAN_LABELS: Record<Plan, string> = {
  basic: "Basic",
  pro: "Pro",
  max: "Max",
};

export const PLAN_TAGLINE: Record<Plan, string> = {
  basic: "O essencial para receber pedidos e pagamentos à mesa.",
  pro: "Tudo do Basic, mais dados para gerir o negócio.",
  max: "Tudo do Pro, mais stock e inteligência artificial.",
};

// O que cada plano inclui (cumulativo), para a tabela comparativa.
export const PLAN_INCLUDES: Record<Plan, string[]> = {
  basic: [
    "Pedidos por QR code",
    "Painel de cozinha em tempo real",
    "Marcar pratos como esgotados",
    "Recebimento de pagamentos",
    "Suporte em dias e horários úteis",
  ],
  pro: [
    "Balanço financeiro diário e mensal",
    "Horas de pico, ticket médio e tendências",
    "Pratos mais vendidos",
  ],
  max: [
    "Gestão de stock com baixa automática",
    "Resumo inteligente do dia (IA)",
    "Previsão de procura (IA)",
    "Destaque automático do mais pedido",
    "Alerta preditivo de stock",
    "Suporte 24h, 7 dias por semana",
  ],
};
