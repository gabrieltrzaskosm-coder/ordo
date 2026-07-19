import { requireStaff } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";

export const dynamic = "force-dynamic";

// Aberto a todos os papéis (inclui cozinha/atendimento), por isso vive fora de
// /gestao — só requireStaff, não requireManager.
export default async function ContaPage() {
  const session = await requireStaff();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-1 text-xl font-medium">A minha conta</h1>
      <p className="mb-6 text-sm text-neutral-500">{session.email}</p>

      <h2 className="mb-3 text-sm font-medium text-neutral-500">
        Alterar palavra-passe
      </h2>
      <PasswordForm />
    </main>
  );
}
