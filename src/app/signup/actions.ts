"use server";

// Signup do dono: cria a conta, o estabelecimento e o registo de staff (owner).
//
// A conta é criada pelo fluxo público (signUp), não pelo admin client, porque é
// esse que dispara o email de confirmação — admin.createUser não envia nada.
// O estabelecimento e o staff são criados já a seguir (via admin, porque ainda
// não há sessão para passar a RLS); o acesso só abre quando o email é
// confirmado em /auth/confirm.
//
// Ordem importa: se a criação do estabelecimento falhar depois de o utilizador
// existir, apagamos o utilizador para não deixar contas órfãs.
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { slugify } from "@/lib/slug";

export type SignupState = { error: string | null };

// Cadastro do dono (pt-BR). Além da conta e do restaurante, capturamos já o
// nome do responsável (fica no staff), o WhatsApp e o CNPJ/CPF — dados que o
// onboarding manual usa e que a faturação vai precisar. CNPJ/CPF e nome do
// responsável são opcionais para não travar o cadastro.
const schema = z.object({
  establishmentName: z.string().trim().min(2).max(80),
  ownerName: z.string().trim().max(80).optional(),
  phone: z.string().trim().min(8).max(20),
  taxId: z.string().trim().max(20).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export async function signUp(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = schema.safeParse({
    establishmentName: formData.get("establishmentName"),
    ownerName: formData.get("ownerName") || undefined,
    phone: formData.get("phone"),
    taxId: formData.get("taxId") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error:
        "Confira os dados: nome do restaurante (mín. 2), WhatsApp, e-mail válido e senha (mín. 8).",
    };
  }
  const { establishmentName, ownerName, phone, taxId, email, password } =
    parsed.data;

  const supabase = await createClient();
  const { data, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${publicEnv.appUrl}/auth/confirm` },
  });
  if (signUpErr || !data.user) {
    return { error: "Não foi possível criar a conta com este email." };
  }

  // Email já registado: o Supabase devolve um utilizador obfuscado, com
  // `identities` vazio, para não revelar quem tem conta. Paramos aqui — criar
  // um estabelecimento agora dava-o a quem já existe (e revelava o registo).
  if (data.user.identities && data.user.identities.length === 0) {
    redirect("/signup/confirmar");
  }

  const userId = data.user.id;
  const admin = createAdminClient();

  const { data: est, error: estErr } = await admin
    .from("establishments")
    .insert({
      name: establishmentName,
      slug: slugify(establishmentName),
      phone,
      vat_number: taxId ?? null,
    })
    .select("id")
    .single();
  if (estErr || !est) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "Falha ao criar o restaurante. Tente novamente." };
  }

  const { error: staffErr } = await admin.from("staff").insert({
    establishment_id: est.id,
    auth_user_id: userId,
    role: "owner",
    display_name: ownerName ?? null,
  });
  if (staffErr) {
    await admin.from("establishments").delete().eq("id", est.id);
    await admin.auth.admin.deleteUser(userId);
    return { error: "Falha ao concluir o cadastro. Tente novamente." };
  }

  // Com "Confirm email" desligado no projeto, o signUp já devolve sessão e não
  // há nada a confirmar — segue direto para a gestão.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/gestao");
  }

  redirect("/signup/confirmar");
}
