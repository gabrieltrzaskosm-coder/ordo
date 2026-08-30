"use server";

import { z } from "zod";

const diagnosticSchema = z.object({
  restaurantName: z.string().trim().min(2, "Informe o nome do restaurante."),
  ownerName: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("Informe um e-mail válido."),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido."),
  role: z.string().trim().min(1, "Informe seu cargo."),
  waiters: z.string().trim().min(1, "Informe a quantidade de garçons."),
  profile: z.string().trim().min(1, "Selecione o perfil do restaurante."),
  authority: z.string().trim().min(1, "Informe seu papel no restaurante."),
  budget: z.string().trim().min(1, "Selecione uma faixa de investimento."),
  need: z.string().trim().min(1, "Selecione o principal desafio."),
  goal: z.string().trim().min(1, "Informe o resultado mais importante."),
  website: z.string().max(0).optional(),
});

export type DiagnosticResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fields?: Record<string, string> };

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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      message:
        "O formulário está temporariamente indisponível. Tente novamente em alguns minutos.",
    };
  }

  const { restaurantName, ownerName, email, whatsapp, role, authority, profile, budget, need, waiters, goal } = parsed.data;
  const hotSignals = [
    role === "Dono",
    authority === "Sim, a decisão é só minha",
    need === "Aumentar as receitas e lucros",
    waiters === "4 ou mais",
  ];
  const warmSignals = [
    role === "CEO",
    authority === "Tenho um sócio, decidimos juntos",
    need === "Atender mais rápido e aumentar a demanda",
    waiters === "2-3",
  ];
  const lead = hotSignals.some(Boolean)
    ? "Lead Quente"
    : warmSignals.some(Boolean)
      ? "Lead Morno"
      : "Lead em qualificação";
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
    `Classificação: ${lead}`,
    `Perfil: ${profile}`,
    `Papel na decisão: ${authority}`,
    `Faixa de investimento: ${budget}`,
    `Principal desafio: ${need}`,
    `Garçons de salão: ${waiters}`,
    `Resultado desejado: ${goal}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "Ordo <onboarding@resend.dev>",
        to: ["otumia@gmail.com"],
        reply_to: email,
        subject,
        text,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Falha ao enviar diagnóstico para o Resend", response.status);
      return {
        ok: false,
        message:
          "Não foi possível enviar agora. Tente novamente ou fale conosco por e-mail.",
      };
    }
  } catch (error) {
    console.error("Erro de rede ao enviar diagnóstico", error);
    return {
      ok: false,
      message: "Não foi possível enviar agora. Tente novamente em instantes.",
    };
  }

  return {
    ok: true,
    message: "Diagnóstico recebido. Nossa equipe vai falar com você em breve.",
  };
}
