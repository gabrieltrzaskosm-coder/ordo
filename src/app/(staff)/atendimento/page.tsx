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
      // O que o garçom precisa de tratar: pedidos ativos (não fechados, não
      // cancelados) que estão POR PAGAR (para cobrar) OU PRONTOS (para ir
      // buscar à cozinha e entregar). Um pedido pode ser as duas coisas.
      supabase
        .from("orders")
        .select(
          "id, customer_name, total_cents, status, paid_at, restaurant_tables(label), order_items(name_snapshot, qty)",
        )
        .is("closed_at", null)
        .neq("status", "cancelled")
        .or("paid_at.is.null,status.eq.ready")
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
    paid: o.paid_at !== null,
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
