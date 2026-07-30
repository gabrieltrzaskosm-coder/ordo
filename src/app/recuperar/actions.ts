"use server";

// "Esqueci-me da senha": envia o link de recuperação.
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

export type RecoverState = { error: string | null; sent: boolean };

const schema = z.string().trim().email();

export async function requestRecovery(
  _prev: RecoverState,
  formData: FormData,
): Promise<RecoverState> {
  const parsed = schema.safeParse(formData.get("email"));
  if (!parsed.success) return { sent: false, error: "Email inválido." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${publicEnv.appUrl}/auth/confirm?next=/nova-senha`,
  });

  // Resposta igual quer o email exista ou não: caso contrário isto vira um
  // oráculo para descobrir quem tem conta. O erro real (se houver) fica no
  // lado do Supabase.
  return { sent: true, error: null };
}
