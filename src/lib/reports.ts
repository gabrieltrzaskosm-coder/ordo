// Relatórios do plano Pro (financeiro + insights), calculados a partir dos dados
// que já existem — sem pedir nada ao cliente. Corre sob a sessão autenticada do
// manager (a RLS restringe ao seu estabelecimento). A IA do Max reutiliza esta
// camada.
//
// Nota de fuso: as fronteiras de dia/mês usam a hora do servidor (UTC no
// Vercel). Portugal é UTC+0/+1, por isso pode haver um desvio de 1h à volta da
// meia-noite. Suficiente para gestão; afinar com o fuso do estabelecimento se
// preciso.
import "server-only";
import { createClient } from "@/lib/supabase/server";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}
function dayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD (UTC)
}

export type FinanceReport = {
  today: { orders: number; paidCents: number; openCents: number; tipsCents: number };
  month: { orders: number; paidCents: number; ordersPaid: number; ticketCents: number };
  daily: { day: string; orders: number; paidCents: number }[];
};

export async function getFinanceReport(): Promise<FinanceReport> {
  const supabase = await createClient();
  const monthStart = startOfMonth().toISOString();

  const { data } = await supabase
    .from("orders")
    .select("created_at, paid_at, total_cents, tip_cents")
    .neq("status", "cancelled")
    .gte("created_at", monthStart)
    .order("created_at", { ascending: true });

  const rows = data ?? [];
  const todayStart = startOfToday().getTime();

  const today = { orders: 0, paidCents: 0, openCents: 0, tipsCents: 0 };
  const month = { orders: 0, paidCents: 0, ordersPaid: 0, ticketCents: 0 };
  const dailyMap = new Map<string, { orders: number; paidCents: number }>();

  for (const o of rows) {
    const paid = o.paid_at !== null;
    month.orders += 1;
    if (paid) {
      month.paidCents += o.total_cents;
      month.ordersPaid += 1;
    }

    const d = dailyMap.get(dayKey(o.created_at)) ?? { orders: 0, paidCents: 0 };
    d.orders += 1;
    if (paid) d.paidCents += o.total_cents;
    dailyMap.set(dayKey(o.created_at), d);

    if (new Date(o.created_at).getTime() >= todayStart) {
      today.orders += 1;
      if (paid) {
        today.paidCents += o.total_cents;
        today.tipsCents += o.tip_cents;
      } else {
        today.openCents += o.total_cents;
      }
    }
  }

  month.ticketCents = month.ordersPaid
    ? Math.round(month.paidCents / month.ordersPaid)
    : 0;

  const daily = [...dailyMap.entries()]
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => b.day.localeCompare(a.day));

  return { today, month, daily };
}

export type Insights = {
  topItems: { name: string; qty: number }[];
  byHour: number[]; // 24 posições, nº de pedidos por hora
  thisWeek: { orders: number; paidCents: number };
  lastWeek: { orders: number; paidCents: number };
};

export async function getInsights(): Promise<Insights> {
  const supabase = await createClient();
  const since = daysAgo(30).toISOString();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, total_cents, paid_at")
    .neq("status", "cancelled")
    .gte("created_at", since);

  const { data: items } = await supabase
    .from("order_items")
    .select("name_snapshot, qty, order_id")
    .gte("created_at", since);

  const validIds = new Set((orders ?? []).map((o) => o.id));

  // Mais vendidos (só de pedidos não cancelados).
  const qtyByName = new Map<string, number>();
  for (const it of items ?? []) {
    if (!validIds.has(it.order_id)) continue;
    qtyByName.set(it.name_snapshot, (qtyByName.get(it.name_snapshot) ?? 0) + it.qty);
  }
  const topItems = [...qtyByName.entries()]
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Horas de pico.
  const byHour = new Array<number>(24).fill(0);
  for (const o of orders ?? []) {
    byHour[new Date(o.created_at).getHours()] += 1;
  }

  // Tendência: últimos 7 dias vs. os 7 anteriores.
  const week1 = daysAgo(7).getTime();
  const week2 = daysAgo(14).getTime();
  const thisWeek = { orders: 0, paidCents: 0 };
  const lastWeek = { orders: 0, paidCents: 0 };
  for (const o of orders ?? []) {
    const t = new Date(o.created_at).getTime();
    const cents = o.paid_at ? o.total_cents : 0;
    if (t >= week1) {
      thisWeek.orders += 1;
      thisWeek.paidCents += cents;
    } else if (t >= week2) {
      lastWeek.orders += 1;
      lastWeek.paidCents += cents;
    }
  }

  return { topItems, byHour, thisWeek, lastWeek };
}
