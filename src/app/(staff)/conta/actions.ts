"use server";

// Troca da própria palavra-passe (qualquer papel de staff).
//
// A senha atual é reconfirmada com signInWithPassword antes de mudar: a sessão
// vive num cookie, e sem esta reautenticação bastaria um dispositivo deixado
// aberto (ou um CSRF que passasse) para tomar a conta em definitivo. O Supabase
// não valida a senha antiga no updateUser, por isso a verificação é nossa.
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error: string | null; ok: boolean };

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "A confirmação não coincide com a nova palavra-passe.",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "A nova palavra-passe tem de ser diferente da atual.",
  });

export async function changePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const session = await requireStaff();

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    // A primeira mensagem do refine é específica e útil; o resto cai no genérico.
    const issue = parsed.error.issues[0]?.message;
    return {
      ok: false,
      error:
        issue && !issue.startsWith("String must")
          ? issue
          : "A nova palavra-passe tem de ter pelo menos 8 caracteres.",
    };
  }
  const { currentPassword, newPassword } = parsed.data;

  // Contas de staff são sempre criadas com email; a guarda é defensiva.
  if (!session.email) {
    return { ok: false, error: "Conta sem email associado." };
  }

  const supabase = await createClient();

  const { error: reauthErr } = await supabase.auth.signInWithPassword({
    email: session.email,
    password: currentPassword,
  });
  if (reauthErr) {
    return { ok: false, error: "A palavra-passe atual está incorreta." };
  }

  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateErr) {
    return { ok: false, error: "Não foi possível alterar a palavra-passe." };
  }

  return { ok: true, error: null };
}
