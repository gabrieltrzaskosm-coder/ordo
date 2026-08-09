// Demo pública — simulação do hub de gestão (inclui "Movimento esperado por
// dia"). Sidebar navega para as outras simulações. Dados fictícios, sem auth.
import { GestaoShell } from "../(staff)/gestao/GestaoShell";
import { GestaoHub, type HubStat, type WeekdayAvg } from "../(staff)/gestao/GestaoHub";
import { DEMO_LINKS } from "./_links";

const stats: HubStat[] = [
  { label: "Pedidos hoje", value: "23" },
  { label: "Valor pedido", value: "R$ 864,00", accent: true },
  { label: "Ticket médio", value: "R$ 37,56" },
];
const weekdays: WeekdayAvg[] = [
  { weekday: 1, label: "Seg", avg: 14 },
  { weekday: 2, label: "Ter", avg: 16 },
  { weekday: 3, label: "Qua", avg: 19 },
  { weekday: 4, label: "Qui", avg: 22 },
  { weekday: 5, label: "Sex", avg: 31 },
  { weekday: 6, label: "Sáb", avg: 36 },
  { weekday: 0, label: "Dom", avg: 20 },
];

export default function PreviewGestaoHub() {
  return (
    <GestaoShell
      establishmentName="Trattoria Vermelha"
      email="dono@demo.com"
      role="owner"
      plan="max"
      linkOverrides={DEMO_LINKS}
    >
      <GestaoHub
        establishmentName="Trattoria Vermelha"
        plan="max"
        stats={stats}
        weekdays={weekdays}
      />
    </GestaoShell>
  );
}
