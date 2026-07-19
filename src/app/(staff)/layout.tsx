// Guarda de todas as rotas de staff. Corre no servidor antes de qualquer
// página do grupo: sem sessão de staff válida, redireciona para /login.
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();
  const isManager = session.role === "owner" || session.role === "manager";

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{session.establishmentName}</span>
          <nav className="flex gap-3 text-sm text-neutral-500">
            <Link href="/cozinha" className="hover:text-neutral-900">
              Cozinha
            </Link>
            {isManager && (
              <Link href="/gestao" className="hover:text-neutral-900">
                Gestão
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            {session.email} · {session.role}
          </span>
          <form action={signOut}>
            <button className="rounded-lg border border-neutral-300 px-3 py-1 text-sm">
              Sair
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
