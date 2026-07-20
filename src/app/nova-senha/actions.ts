"use server";

// Define a nova palavra-passe no fim do fluxo de recuperação.
//
// Aqui não se pede a senha antiga (quem chega esqueceu-a) — a prova é a posse
// do email. Por isso exigimos o cookie pw-recovery que /auth/confirm põe: sem
// ele, uma sessão qualquer podia trocar a senha sem provar nada.
import { z } from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type NovaSenhaState = { error: string | null; ok: boolean };

const schema = z
  .object({
    password: z.string().min(8).max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "A confirmação não coincide.",
  });

export async function setNewPassword(
  _prev: NovaSenhaState,
  formData: FormData,
): Promise<NovaSenhaState> {
  const jar = await cookies();
  if (!jar.get("pw-recovery")) {
    return { ok: false, error: "Sessão de recuperação inválida ou expirada." };
  }

  const parsed = schema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    return {
      ok: false,
      error:
        issue === "A confirmação não coincide."
          ? issue
          : "A palavra-passe tem de ter pelo menos 8 caracteres.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sessão de recuperação inválida ou expirada." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, error: "Não foi possível definir a palavra-passe." };
  }

  jar.delete("pw-recovery");
  return { ok: true, error: null };
}
