// Demo pública — simulação da tela Financeiro no seu "hub". Sidebar navega para
// a simulação do Insights via linkOverrides. Dados fictícios, sem auth.
import { GestaoShell } from "../../(staff)/gestao/GestaoShell";
import { FinanceiroDemo } from "../_Financeiro";
import { DEMO_LINKS } from "../_links";

export default function PreviewFinanceiro() {
  return (
    <GestaoShell
      establishmentName="Trattoria Vermelha"
      email="dono@demo.com"
      role="owner"
      plan="max"
      linkOverrides={DEMO_LINKS}
    >
      <FinanceiroDemo />
    </GestaoShell>
  );
}
