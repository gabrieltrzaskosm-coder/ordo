"use server";

// Signup do dono: cria a conta, o estabelecimento e o registo de staff (owner),
// depois faz login. Usa o admin client (service role) para criar o utilizador
// já confirmado — evita a fricção do email de confirmação nesta fase. Antes de
// produção, ativar verificação de email.
//
// Ordem importa: se a criação do estabelecimento falhar depois de o utilizador
// existir, apagamos o utilizador para não deixar contas órfãs.
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type SignupState = { error: string | null };

const schema = z.object({
  establishmentName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export async function signUp(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = schema.safeParse({
    establishmentName: formData.get("establishmentName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error: "Verifique os dados: nome (mín. 2), email válido e senha (mín. 8).",
    };
  }
  const { establishmentName, email, password } = parsed.data;
  const admin = createAdminClient();

  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userErr || !created?.user) {
    // Mensagem genérica; o caso comum é email já registado.
    return { error: "Não foi possível criar a conta com este email." };
  }
  const userId = created.user.id;

  const { data: est, error: estErr } = await admin
    .from("establishments")
    .insert({ name: establishmentName, slug: slugify(establishmentName) })
    .select("id")
    .single();
  if (estErr || !est) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "Falha ao criar o estabelecimento. Tente novamente." };
  }

  const { error: staffErr } = await admin.from("staff").insert({
    establishment_id: est.id,
    auth_user_id: userId,
    role: "owner",
    display_name: null,
  });
  if (staffErr) {
    await admin.from("establishments").delete().eq("id", est.id);
    await admin.auth.admin.deleteUser(userId);
    return { error: "Falha ao concluir o registo. Tente novamente." };
  }

  // Login (define os cookies de sessão via o cliente de servidor).
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) redirect("/login");

  revalidatePath("/", "layout");
  redirect("/gestao");
}
