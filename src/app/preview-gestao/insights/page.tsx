// Demo pública — simulação da tela Insights no seu "hub". Sidebar navega para a
// simulação do Financeiro via linkOverrides. Dados fictícios, sem auth.
import { GestaoShell } from "../../(staff)/gestao/GestaoShell";
import { InsightsDemo } from "../_Insights";
import { DEMO_LINKS } from "../_links";

export default function PreviewInsights() {
  return (
    <GestaoShell
      establishmentName="Trattoria Vermelha"
      email="dono@demo.com"
      role="owner"
      plan="max"
      linkOverrides={DEMO_LINKS}
    >
      <InsightsDemo />
    </GestaoShell>
  );
}
