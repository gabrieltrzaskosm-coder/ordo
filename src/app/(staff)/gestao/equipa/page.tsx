import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EquipaManager, type StaffMember } from "./EquipaManager";

export const dynamic = "force-dynamic";

export default async function EquipaPage() {
  const session = await requireManager();
  const supabase = await createClient();

  // A RLS de `staff` já restringe ao próprio estabelecimento. O email vive em
  // auth.users (não acessível via RLS ao cliente), por isso mostramos o nome e
  // o papel — suficiente para gerir a equipa.
  const { data: members } = await supabase
    .from("staff")
    .select("id, role, display_name, auth_user_id, created_at")
    .order("created_at", { ascending: true });

  const staff: StaffMember[] = (members ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    displayName: m.display_name,
    isSelf: m.auth_user_id === session.userId,
  }));

  return <EquipaManager staff={staff} />;
}
