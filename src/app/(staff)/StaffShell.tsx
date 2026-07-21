"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

type Props = {
  email: string | null;
  role: string;
  establishmentName: string;
  isManager: boolean;
  children: React.ReactNode;
};

// A área de staff partilha o mesmo layout mas troca de acento por secção:
// gestão = vermelho, cozinha = azul. O tema é escolhido pela rota atual e
// aplicado a todo o wrapper (header incluído).
export function StaffShell({
  email,
  role,
  establishmentName,
  isManager,
  children,
}: Props) {
  const pathname = usePathname();
  const inKitchen = pathname.startsWith("/cozinha");
  const theme = inKitchen ? "theme-kitchen" : "theme-manager";

  return (
    <div className={`${theme} min-h-screen bg-canvas`}>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="h-2 w-2 rounded-full bg-brand" />
              {establishmentName}
            </span>
            <nav className="flex gap-1 text-sm">
              <NavLink href="/cozinha" active={inKitchen}>
                Cozinha
              </NavLink>
              {isManager && (
                <NavLink href="/gestao" active={!inKitchen}>
                  Gestão
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/conta"
              className="hidden text-xs text-muted transition-colors hover:text-ink sm:inline"
            >
              {email} · {role}
            </Link>
            <form action={signOut}>
              <button className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink transition active:scale-95">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 font-medium transition ${
        active
          ? "bg-brand-weak text-brand-strong"
          : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
