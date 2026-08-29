// Relatórios do plano Pro (financeiro + insights), calculados a partir dos dados
// que já existem — sem pedir nada ao cliente. Corre sob a sessão autenticada do
// manager (a RLS restringe ao seu estabelecimento). A IA do Max reutiliza esta
// camada.
//
// Nota de fuso: as fronteiras de dia/mês usam a hora do servidor (UTC no
// Vercel). Para o Brasil, isso pode deslocar o fechamento do dia em relação ao
// horário local do estabelecimento; o ideal é persistir o fuso por restaurante
// antes de usar os relatórios como fechamento contábil.
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
function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}
function dayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD (UTC)
}

// ---------- Média de movimento por dia da semana ----------

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
// Ordem de exibição: segunda → domingo.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export type WeekdayAverage = {
  weekday: number; // getDay(): 0=Dom … 6=Sáb
  label: string;
  avg: number; // média de pedidos nesse dia da semana
};

/**
 * Média de pedidos por dia da semana, sobre as últimas 8 semanas — uma "base"
 * do movimento esperado (ex.: numa sexta típica, ~X pedidos). Divide o total de
 * pedidos de cada dia da semana pelo nº de vezes que esse dia ocorreu no
 * histórico. Corre sob a RLS do manager.
 */
export async function getWeekdayAverages(): Promise<WeekdayAverage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("created_at, status")
    .gte("created_at", daysAgo(56).toISOString());

  const valid = (data ?? []).filter((o) => o.status !== "cancelled");

  const counts = Array(7).fill(0) as number[];
  const dates: Array<Set<string>> = Array.from({ length: 7 }, () => new Set());
  for (const o of valid) {
    const wd = new Date(o.created_at).getDay();
    counts[wd] += 1;
    dates[wd].add(dayKey(o.created_at));
  }

  return WEEKDAY_ORDER.map((wd) => {
    const occurrences = dates[wd].size;
    return {
      weekday: wd,
      label: WEEKDAY_LABELS[wd],
      avg: occurrences > 0 ? Math.round(counts[wd] / occurrences) : 0,
    };
  });
}

// ---------- Períodos e intervalos ----------
//
// Um período é um preset (últimos N dias/meses). Um intervalo (DateRange) é o
// par [from, to) já resolvido em datas, que é o que as consultas usam. As
// fronteiras seguem a hora do servidor (ver nota de fuso no topo do ficheiro).

export type Period = "1d" | "7d" | "15d" | "30d" | "3m" | "6m";

export const PERIODS: { key: Period; label: string }[] = [
  { key: "1d", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "15d", label: "15 dias" },
  { key: "30d", label: "30 dias" },
  { key: "3m", label: "3 meses" },
  { key: "6m", label: "6 meses" },
];

export const DEFAULT_PERIOD: Period = "30d";

export function isPeriod(v: string | undefined | null): v is Period {
  return (
    v === "1d" || v === "7d" || v === "15d" ||
    v === "30d" || v === "3m" || v === "6m"
  );
}

export type DateRange = { from: Date; to: Date };

/** Intervalo [from, to) de um preset, terminando "agora". */
export function periodRange(key: Period): DateRange {
  const to = new Date();
  switch (key) {
    case "1d":
      return { from: startOfToday(), to };
    case "7d":
      return { from: daysAgo(7), to };
    case "15d":
      return { from: daysAgo(15), to };
    case "30d":
      return { from: daysAgo(30), to };
    case "3m":
      return { from: monthsAgo(3), to };
    case "6m":
      return { from: monthsAgo(6), to };
  }
}

/** Janela imediatamente anterior, com a mesma duração (para tendência). */
export function previousRange({ from, to }: DateRange): DateRange {
  const span = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - span), to: new Date(from.getTime()) };
}

/**
 * Converte duas datas "YYYY-MM-DD" (dos inputs) num intervalo [from, to).
 * `toStr` é inclusivo: soma-se 1 dia para apanhar o dia inteiro. Devolve null
 * se faltar alguma data, forem inválidas ou o intervalo não fizer sentido.
 */
export function parseDateRange(
  fromStr?: string | null,
  toStr?: string | null,
): DateRange | null {
  if (!fromStr || !toStr) return null;
  const from = new Date(fromStr + "T00:00:00");
  const toEnd = new Date(toStr + "T00:00:00");
  if (Number.isNaN(from.getTime()) || Number.isNaN(toEnd.getTime())) return null;
  toEnd.setDate(toEnd.getDate() + 1); // fim inclusivo
  if (from >= toEnd) return null;
  return { from, to: toEnd };
}

// Acima deste nº de dias, a série passa de diária para mensal (senão a tabela
// de "6 meses" teria ~180 linhas).
const MONTHLY_ABOVE_DAYS = 45;

export type Granularity = "day" | "month";

export type RangeMetrics = {
  orders: number;
  ordersPaid: number;
  paidCents: number; // faturado (pedidos pagos)
  openCents: number; // servido mas por cobrar
  tipsCents: number;
  ticketCents: number; // ticket médio dos pedidos pagos
  topItems: { name: string; qty: number }[];
  byHour: number[]; // 24 posições, nº de pedidos por hora
  granularity: Granularity;
  series: { bucket: string; orders: number; paidCents: number }[]; // asc por bucket
};

/**
 * Métricas agregadas de um intervalo [from, to). É a base partilhada das
 * páginas de análise (financeiro + insights) e da comparação de períodos.
 * Corre sob a sessão autenticada (a RLS restringe ao estabelecimento).
 */
export async function getRangeMetrics(
  from: Date,
  to: Date,
): Promise<RangeMetrics> {
  const supabase = await createClient();
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, created_at, paid_at, total_cents, tip_cents")
      .neq("status", "cancelled")
      .gte("created_at", fromIso)
      .lt("created_at", toIso)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_items")
      .select("name_snapshot, qty, order_id")
      .gte("created_at", fromIso)
      .lt("created_at", toIso),
  ]);

  const rows = orders ?? [];
  const spanDays = (to.getTime() - from.getTime()) / 86_400_000;
  const granularity: Granularity = spanDays > MONTHLY_ABOVE_DAYS ? "month" : "day";
  const bucketOf = (iso: string) =>
    granularity === "month" ? iso.slice(0, 7) : dayKey(iso);

  let ordersCount = 0;
  let ordersPaid = 0;
  let paidCents = 0;
  let openCents = 0;
  let tipsCents = 0;
  const byHour = new Array<number>(24).fill(0);
  const seriesMap = new Map<string, { orders: number; paidCents: number }>();

  for (const o of rows) {
    const paid = o.paid_at !== null;
    ordersCount += 1;
    byHour[new Date(o.created_at).getHours()] += 1;

    if (paid) {
      ordersPaid += 1;
      paidCents += o.total_cents;
      tipsCents += o.tip_cents;
    } else {
      openCents += o.total_cents;
    }

    const key = bucketOf(o.created_at);
    const b = seriesMap.get(key) ?? { orders: 0, paidCents: 0 };
    b.orders += 1;
    if (paid) b.paidCents += o.total_cents;
    seriesMap.set(key, b);
  }

  // Mais vendidos: só itens de pedidos não cancelados dentro do intervalo.
  const validIds = new Set(rows.map((o) => o.id));
  const qtyByName = new Map<string, number>();
  for (const it of items ?? []) {
    if (!validIds.has(it.order_id)) continue;
    qtyByName.set(it.name_snapshot, (qtyByName.get(it.name_snapshot) ?? 0) + it.qty);
  }
  const topItems = [...qtyByName.entries()]
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const series = [...seriesMap.entries()]
    .map(([bucket, v]) => ({ bucket, ...v }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));

  return {
    orders: ordersCount,
    ordersPaid,
    paidCents,
    openCents,
    tipsCents,
    ticketCents: ordersPaid ? Math.round(paidCents / ordersPaid) : 0,
    topItems,
    byHour,
    granularity,
    series,
  };
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
