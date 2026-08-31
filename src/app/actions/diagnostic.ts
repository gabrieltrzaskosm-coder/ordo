"use server";

import { z } from "zod";
import {
  calculateDiagnosticScore,
  type DiagnosticAnalysis,
} from "@/lib/diagnostic-score";

const diagnosticSchema = z.object({
  restaurantName: z.string().trim().min(2, "Informe o nome do restaurante."),
  ownerName: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("Informe um e-mail válido."),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido."),
  role: z.string().trim().min(1, "Informe seu cargo."),
  waiters: z.string().trim().min(1, "Informe a quantidade de garçons."),
  profile: z.string().trim().min(1, "Selecione o perfil do restaurante."),
  authority: z.string().trim().min(1, "Informe seu papel no restaurante."),
  budget: z.string().trim().min(1, "Informe como a equipe pesa na receita."),
  need: z.string().trim().min(1, "Selecione o principal desafio."),
  goal: z.string().trim().min(1, "Informe o resultado mais importante."),
  website: z.string().max(0).optional(),
});

export type DiagnosticResult =
  | { ok: true; message: string; analysis?: DiagnosticAnalysis }
  | { ok: false; message: string; fields?: Record<string, string>; analysis?: DiagnosticAnalysis };

export async function submitDiagnostic(
  formData: FormData,
): Promise<DiagnosticResult> {
  const parsed = diagnosticSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fields[field]) fields[field] = issue.message;
    }
    return { ok: false, message: "Revise os campos destacados.", fields };
  }

  // Campo invisível para reduzir envios automáticos sem criar fricção para o dono.
  if (parsed.data.website) return { ok: true, message: "Diagnóstico recebido." };

  const analysis = calculateDiagnosticScore(parsed.data);
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      message:
        "O formulário está temporariamente indisponível. Tente novamente em alguns minutos.",
      analysis,
    };
  }

  const { restaurantName, ownerName, email, whatsapp, role, authority, profile, budget, need, waiters, goal } = parsed.data;
  const subject = `Formulário do Sistema ORDO - ${restaurantName}`;
  const text = [
    "Novo diagnóstico de lucro operacional — Ordo",
    "",
    `Restaurante: ${restaurantName}`,
    `Responsável: ${ownerName}`,
    `E-mail: ${email}`,
    `WhatsApp: ${whatsapp}`,
    "",
    "QUALIFICAÇÃO",
    `Cargo: ${role}`,
    `Classificação geral: ${analysis.lead}`,
    `Potencial estimado de melhoria: ${analysis.lead === "Lead Quente" ? "Alto" : analysis.lead === "Lead Morno" ? "Médio" : "Inicial"}`,
    `Perfil: ${profile}`,
    `Papel na decisão: ${authority}`,
    `Peso da equipe na receita: ${budget}`,
    `Principal desafio: ${need}`,
    `Garçons de salão: ${waiters}`,
    `Resultado desejado: ${goal}`,
    "",
    "CLASSIFICAÇÃO POR RESPOSTA",
    `Cargo: ${analysis.breakdown.role}`,
    `Decisão: ${analysis.breakdown.authority}`,
    `Cenário: ${analysis.breakdown.profile}`,
    `Peso da equipe: ${analysis.breakdown.budget}`,
    `Desafio: ${analysis.breakdown.need}`,
    `Garçons: ${analysis.breakdown.waiters}`,
    `Resultado desejado: ${analysis.breakdown.goal}`,
  ].join("\n");

  const resendController = new AbortController();
  const resendTimeout = setTimeout(() => resendController.abort(), 12_000);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "ordo-diagnostic/1.0",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "Ordo <onboarding@resend.dev>",
        to: ["otium.sap@gmail.com"],
        reply_to: email,
        subject,
        text,
      }),
      signal: resendController.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(
        "Falha ao enviar diagnóstico para o Resend",
        response.status,
        errorBody,
      );
      return {
        ok: false,
        message:
          "Não foi possível enviar agora. Tente novamente ou fale conosco por e-mail.",
        analysis,
      };
    }
  } catch (error) {
    console.error("Erro de rede ao enviar diagnóstico", error);
    return {
      ok: false,
      message:
        error instanceof Error && error.name === "AbortError"
          ? "O envio demorou mais que o esperado. Tente novamente."
          : "Não foi possível enviar agora. Tente novamente em instantes.",
      analysis,
    };
  } finally {
    clearTimeout(resendTimeout);
  }

  return {
    ok: true,
    message: "Diagnóstico recebido. Nossa equipe vai falar com você em breve.",
    analysis,
  };
}
