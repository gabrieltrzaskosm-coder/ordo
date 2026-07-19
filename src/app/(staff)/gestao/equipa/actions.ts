"use server";

// Gestão de equipa. O owner/manager cria contas de staff do SEU estabelecimento.
// A criação do utilizador auth usa o admin client (service role); a associação
// establishment_id vem SEMPRE da sessão do próprio manager (requireManager),
// nunca do formulário — um manager não pode inserir staff noutro estabelecimento.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireManager } from "@/lib/auth";

export type ActionResult = { ok: boolean; error?: string };

const createSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().max(60).optional(),
  role: z.enum(["manager", "kitchen", "waiter"]),
});

export async function createStaff(formData: FormData): Promise<ActionResult> {
  const session = await requireManager();
  const parsed = createSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName") || undefined,
    role: formData.get("role"),
  });
  // 'owner' não é criável aqui de propósito: há um único owner (o fundador).
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const { email, password, displayName, role } = parsed.data;

  const admin = createAdminClient();
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userErr || !created?.user) {
    return { ok: false, error: "Não foi possível criar a conta (email já usado?)." };
  }

  const { error: staffErr } = await admin.from("staff").insert({
    establishment_id: session.establishmentId,
    auth_user_id: created.user.id,
    role,
    display_name: displayName ?? null,
  });
  if (staffErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: "Falha ao associar a conta à equipa." };
  }

  revalidatePath("/gestao/equipa");
  return { ok: true };
}

export async function removeStaff(staffId: string): Promise<ActionResult> {
  const session = await requireManager();
  const admin = createAdminClient();

  // Lê o registo confirmando que pertence a este estabelecimento e que não é o
  // próprio (um manager não se remove a si) nem o owner.
  const { data: target } = await admin
    .from("staff")
    .select("id, role, auth_user_id, establishment_id")
    .eq("id", staffId)
    .maybeSingle();

  if (!target || target.establishment_id !== session.establishmentId) {
    return { ok: false, error: "Registo não encontrado." };
  }
  if (target.role === "owner") {
    return { ok: false, error: "O dono não pode ser removido." };
  }
  if (target.auth_user_id === session.userId) {
    return { ok: false, error: "Não pode remover-se a si próprio." };
  }

  // Apagar o utilizador auth remove o registo staff por ON DELETE CASCADE.
  const { error } = await admin.auth.admin.deleteUser(target.auth_user_id);
  if (error) return { ok: false, error: "Falha ao remover a conta." };

  revalidatePath("/gestao/equipa");
  return { ok: true };
}
