// Guarda de todas as rotas de staff. Corre no servidor antes de qualquer
// página do grupo: sem sessão de staff válida, redireciona para /login.
import { requireStaff } from "@/lib/auth";
import { StaffShell } from "./StaffShell";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();
  const isManager = session.role === "owner" || session.role === "manager";

  return (
    <StaffShell
      email={session.email}
      role={session.role}
      establishmentName={session.establishmentName}
      isManager={isManager}
    >
      {children}
    </StaffShell>
  );
}
