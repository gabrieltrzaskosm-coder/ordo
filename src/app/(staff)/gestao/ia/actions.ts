"use server";

// Gera o resumo inteligente sob pedido (o LLM custa e demora; não é automático).
import { requirePlan } from "@/lib/auth";
import { generateDailySummary, type SummaryResult } from "@/lib/ai";

export async function generateSummary(): Promise<SummaryResult> {
  await requirePlan("max");
  return generateDailySummary();
}
