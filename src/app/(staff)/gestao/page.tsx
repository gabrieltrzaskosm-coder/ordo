import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { getWeekdayAverages } from "@/lib/reports";
import { GestaoHub, type HubStat } from "./GestaoHub";

export const dynamic = "force-dynamic";

export default async function GestaoPage() {
  const session = await requireManager();
  const supabase = await createClient();
  const weekdaysPromise = getWeekdayAverages();

  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const [{ data: hoje }, weekdays] = await Promise.all([
    supabase
      .from("orders")
      .select("total_cents, status")
      .gte("created_at", inicioDoDia.toISOString()),
    weekdaysPromise,
  ]);

  const validos = (hoje ?? []).filter((o) => o.status !== "cancelled");
  const totalCents = validos.reduce((s, o) => s + o.total_cents, 0);
  const ticketMedio = validos.length
    ? Math.round(totalCents / validos.length)
    : 0;

  const stats: HubStat[] = [
    { label: "Pedidos hoje", value: String(validos.length) },
    { label: "Valor pedido", value: formatMoney(totalCents), accent: true },
    { label: "Ticket médio", value: formatMoney(ticketMedio) },
  ];

  return (
    <GestaoHub
      establishmentName={session.establishmentName}
      plan={session.plan}
      stats={stats}
      weekdays={weekdays}
    />
  );
}
