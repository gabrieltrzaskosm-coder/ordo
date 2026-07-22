// Exportação CSV do mês corrente (plano Pro). Gerado no servidor sob a sessão
// do manager (RLS restringe ao estabelecimento). Separador ';' e BOM UTF-8 para
// abrir bem no Excel em pt-PT.
import { requirePlan } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function csvField(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  await requirePlan("pro");
  const supabase = await createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("orders")
    .select(
      "created_at, status, total_cents, paid_at, customer_name, restaurant_tables(label)",
    )
    .neq("status", "cancelled")
    .gte("created_at", monthStart.toISOString())
    .order("created_at", { ascending: true });

  const header = ["Data", "Mesa", "Cliente", "Estado", "Total (€)", "Pago"];
  const lines = [header.join(";")];

  for (const o of data ?? []) {
    const table = o.restaurant_tables as unknown as { label: string } | null;
    lines.push(
      [
        csvField(new Date(o.created_at).toLocaleString("pt-PT")),
        csvField(table?.label ?? "—"),
        csvField(o.customer_name ?? ""),
        csvField(o.status),
        csvField((o.total_cents / 100).toFixed(2).replace(".", ",")),
        csvField(o.paid_at ? "Sim" : "Não"),
      ].join(";"),
    );
  }

  const csv = "﻿" + lines.join("\r\n");
  const filename = `balanco-${monthStart.toISOString().slice(0, 7)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
