import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMenu } from "@/lib/menu";
import {
  Atendimento,
  type OpenCall,
  type OpenPayment,
  type TableRow,
} from "./Atendimento";

// Painel operacional: sempre fresco.
export const dynamic = "force-dynamic";

export default async function AtendimentoPage() {
  const session = await requireStaff();
  const supabase = await createClient();

  // RLS restringe tudo ao estabelecimento do staff.
  const [menu, { data: tables }, { data: calls }, { data: orders }] =
    await Promise.all([
      getMenu(session.establishmentId),
      supabase
        .from("restaurant_tables")
        .select("id, label")
        .order("label", { ascending: true }),
      supabase
        .from("waiter_calls")
        .select("id, created_at, restaurant_tables(label)")
        .eq("status", "open")
        .order("created_at", { ascending: true }),
      // Pagamentos em aberto: pedidos ativos (não fechados, não cancelados) e
      // ainda por pagar. É o que o garçom precisa de cobrar.
      supabase
        .from("orders")
        .select(
          "id, customer_name, total_cents, status, restaurant_tables(label), order_items(name_snapshot, qty)",
        )
        .is("paid_at", null)
        .is("closed_at", null)
        .neq("status", "cancelled")
        .order("created_at", { ascending: true }),
    ]);

  const label = (r: unknown) =>
    (r as { label: string } | null)?.label ?? "—";

  const openCalls: OpenCall[] = (calls ?? []).map((c) => ({
    id: c.id,
    createdAt: c.created_at,
    tableLabel: label(c.restaurant_tables),
  }));

  const openPayments: OpenPayment[] = (orders ?? []).map((o) => ({
    id: o.id,
    tableLabel: label(o.restaurant_tables),
    customerName: o.customer_name,
    totalCents: o.total_cents,
    status: o.status,
    items: (o.order_items ?? []).map((i) => ({
      name: i.name_snapshot,
      qty: i.qty,
    })),
  }));

  const tableRows: TableRow[] = (tables ?? []).map((t) => ({
    id: t.id,
    label: t.label,
  }));

  return (
    <Atendimento
      establishmentId={session.establishmentId}
      menu={menu}
      tables={tableRows}
      calls={openCalls}
      payments={openPayments}
    />
  );
}
