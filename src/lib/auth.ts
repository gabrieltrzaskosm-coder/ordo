// Guardas de autorização do staff. Ponto único onde se resolve
// "quem é este utilizador e a que estabelecimento/papel pertence".
//
// Nota: a query a `staff` corre sob RLS. A política de staff chama
// private.auth_establishment_id(), que é SECURITY DEFINER — por isso lê a
// tabela sem reentrar na RLS e não há recursão infinita.
import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type StaffRole = Database["public"]["Enums"]["staff_role"];

export type StaffSession = {
  userId: string;
  email: string | null;
  staffId: string;
  role: StaffRole;
  establishmentId: string;
  establishmentName: string;
};

/** Exige sessão de staff válida. Redireciona para /login se não houver. */
export async function requireStaff(): Promise<StaffSession> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staff } = await supabase
    .from("staff")
    .select("id, role, establishment_id, establishments(name)")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  // Autenticado mas sem registo de staff: conta sem acesso a nenhum
  // estabelecimento. Não deve ver nada.
  if (!staff) redirect("/login?erro=sem-acesso");

  const est = staff.establishments as unknown as { name: string } | null;

  return {
    userId: user.id,
    email: user.email ?? null,
    staffId: staff.id,
    role: staff.role,
    establishmentId: staff.establishment_id,
    establishmentName: est?.name ?? "",
  };
}

/** Exige papel de owner/manager (dados sensíveis: financeiro, edição de menu). */
export async function requireManager(): Promise<StaffSession> {
  const session = await requireStaff();
  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/cozinha?erro=sem-permissao");
  }
  return session;
}
