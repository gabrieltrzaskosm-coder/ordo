import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { KitchenBoard, type KitchenOrder, type WaiterCall } from "./KitchenBoard";

// Sempre fresco: é um painel operacional, não pode servir cache.
export const dynamic = "force-dynamic";

// Junta extras repetidos numa etiqueta: ["Bacon","Bacon","Ovo"] → ["2× Bacon","Ovo"].
function groupModifierNames(names: string[]): string[] {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts.entries()].map(([n, c]) => (c > 1 ? `${c}× ${n}` : n));
}

export default async function CozinhaPage() {
  const session = await requireStaff();
  const supabase = await createClient();

  // Sem filtro por establishment_id: a RLS já restringe ao estabelecimento
  // do staff autenticado.
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, customer_name, status, total_cents, created_at, paid_at, restaurant_tables(label), order_items(id, name_snapshot, qty, notes, order_item_modifiers(name_snapshot))",
    )
    .in("status", ["placed", "in_prep", "ready", "served"])
    .is("closed_at", null)
    .order("created_at", { ascending: true });

  const { data: calls } = await supabase
    .from("waiter_calls")
    .select("id, created_at, restaurant_tables(label)")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  const kitchenOrders: KitchenOrder[] = (orders ?? []).map((o) => {
    const table = o.restaurant_tables as unknown as { label: string } | null;
    return {
      id: o.id,
      customerName: o.customer_name,
      status: o.status,
      totalCents: o.total_cents,
      createdAt: o.created_at,
      paid: o.paid_at !== null,
      tableLabel: table?.label ?? "—",
      items: (o.order_items ?? []).map((i) => ({
        id: i.id,
        name: i.name_snapshot,
        qty: i.qty,
        notes: i.notes,
        // Extras repetidos (ex.: dois "Bacon") são agrupados em "2× Bacon".
        modifiers: groupModifierNames(
          ((i.order_item_modifiers ?? []) as { name_snapshot: string }[]).map(
            (m) => m.name_snapshot,
          ),
        ),
      })),
    };
  });

  const waiterCalls: WaiterCall[] = (calls ?? []).map((c) => {
    const table = c.restaurant_tables as unknown as { label: string } | null;
    return {
      id: c.id,
      createdAt: c.created_at,
      tableLabel: table?.label ?? "—",
    };
  });

  return (
    <KitchenBoard
      orders={kitchenOrders}
      calls={waiterCalls}
      establishmentId={session.establishmentId}
      establishmentName={session.establishmentName}
    />
  );
}
