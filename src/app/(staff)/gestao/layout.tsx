import { requireManager } from "@/lib/auth";
import { GestaoShell } from "./GestaoShell";

// Layout da área de gestão: envolve todas as sub-páginas na sidebar (GestaoShell).
// requireManager garante que só gestores/donos entram; o StaffShell (layout pai)
// deteta /gestao e não renderiza o header, para não duplicar a navegação.
export default async function GestaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireManager();
  return (
    <GestaoShell
      establishmentName={session.establishmentName}
      email={session.email}
      role={session.role}
      plan={session.plan}
    >
      {children}
    </GestaoShell>
  );
}
