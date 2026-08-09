// Demo pública — simulação da tela Ordo IA no seu "hub". Dados fictícios, sem auth.
import { GestaoShell } from "../../(staff)/gestao/GestaoShell";
import { OrdoIaDemo } from "../_OrdoIa";
import { DEMO_LINKS } from "../_links";

export default function PreviewOrdoIa() {
  return (
    <GestaoShell
      establishmentName="Trattoria Vermelha"
      email="dono@demo.com"
      role="owner"
      plan="max"
      linkOverrides={DEMO_LINKS}
    >
      <OrdoIaDemo />
    </GestaoShell>
  );
}
