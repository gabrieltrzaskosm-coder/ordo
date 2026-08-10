"use client";

// Wrapper só do preview: guarda os "pagamentos/prontos" em estado para poder
// SIMULAR um pedido a ficar pronto (o preview não tem Realtime). O botão injeta
// um pedido `ready` novo → dispara o mesmo caminho do alerta (ding + badge +
// card com "Entregue"). Não faz parte do produto; é uma ferramenta de demo.
import { useState } from "react";
import {
  Atendimento,
  type OpenCall,
  type OpenPayment,
  type TableRow,
} from "../(staff)/atendimento/Atendimento";
import type { MenuCategory } from "@/lib/menu";

const SAMPLES: { table: string; items: { name: string; qty: number }[]; totalCents: number }[] = [
  { table: "Mesa 03", items: [{ name: "Burger Ordo", qty: 1 }, { name: "Batata Rústica", qty: 1 }], totalCents: 5680 },
  { table: "Mesa 21", items: [{ name: "Risoto de cogumelos", qty: 2 }], totalCents: 8580 },
  { table: "Mesa 08", items: [{ name: "Poke Bowl", qty: 1 }, { name: "Suco natural", qty: 1 }], totalCents: 4180 },
  { table: "Mesa 14", items: [{ name: "Pizza Margherita", qty: 1 }], totalCents: 4590 },
];

export function DemoAtendimento({
  menu,
  tables,
  calls,
  initialPayments,
}: {
  menu: MenuCategory[];
  tables: TableRow[];
  calls: OpenCall[];
  initialPayments: OpenPayment[];
}) {
  const [payments, setPayments] = useState<OpenPayment[]>(initialPayments);
  const [n, setN] = useState(0);

  function simular() {
    const s = SAMPLES[n % SAMPLES.length];
    setN((v) => v + 1);
    setPayments((p) => [
      {
        id: `sim-${Date.now()}`,
        tableLabel: s.table,
        customerName: null,
        totalCents: s.totalCents,
        status: "ready",
        paid: Math.random() > 0.5,
        items: s.items,
      },
      ...p,
    ]);
  }

  // No preview não há auth/Realtime — resolvemos as ações no estado local para
  // demonstrar o balão a fechar ao entregar (e a conta a sair ao cobrar).
  function entregar(id: string) {
    setPayments((p) =>
      p
        .map((o) => (o.id === id ? { ...o, status: "served" } : o))
        .filter((o) => o.status !== "served" || !o.paid),
    );
  }
  function cobrar(id: string) {
    setPayments((p) => p.filter((o) => o.id !== id));
  }

  return (
    <>
      <Atendimento
        establishmentId="demo"
        menu={menu}
        tables={tables}
        calls={calls}
        payments={payments}
        onDeliver={entregar}
        onCharge={cobrar}
      />
      <button
        onClick={simular}
        className="fixed bottom-4 left-4 z-[70] rounded-full border border-dashed border-warn/50 bg-warn-weak px-3.5 py-2 text-xs font-semibold text-warn shadow-lg active:scale-95"
      >
        ▶ Simular pedido pronto
      </button>
    </>
  );
}
