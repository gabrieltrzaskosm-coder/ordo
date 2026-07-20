import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { NovaSenhaForm } from "./NovaSenhaForm";

export const dynamic = "force-dynamic";

// Só acessível a quem acabou de abrir um link de recuperação (ver o cookie em
// /auth/confirm). Fora do grupo (staff) porque não precisa do header nem do
// registo de staff — só da sessão que o link criou.
export default async function NovaSenhaPage() {
  const jar = await cookies();
  if (!jar.get("pw-recovery")) redirect("/login?erro=link-invalido");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?erro=link-expirado");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-xl font-medium">Nova palavra-passe</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">{user.email}</p>
      <NovaSenhaForm />
    </main>
  );
}
