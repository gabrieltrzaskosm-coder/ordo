// Exportação CSV do período selecionado (plano Pro). Gerado no servidor sob a
// sessão do manager (RLS restringe ao estabelecimento). Separador ';' e BOM
// UTF-8 para abrir bem no Excel em pt-BR. O período vem em `?p=` (default 30d),
// alinhado com a página de balanço.
import { requirePlan } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PERIOD, isPeriod, periodRange } from "@/lib/reports";

function csvField(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  await requirePlan("pro");
  const supabase = await createClient();

  const p = new URL(request.url).searchParams.get("p");
  const period = isPeriod(p) ? p : DEFAULT_PERIOD;
  const { from, to } = periodRange(period);

  const { data } = await supabase
    .from("orders")
    .select(
      "created_at, status, total_cents, paid_at, customer_name, restaurant_tables(label)",
    )
    .neq("status", "cancelled")
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString())
    .order("created_at", { ascending: true });

  const header = ["Data", "Mesa", "Cliente", "Estado", "Total (R$)", "Pago"];
  const lines = [header.join(";")];

  for (const o of data ?? []) {
    const table = o.restaurant_tables as unknown as { label: string } | null;
    lines.push(
      [
        csvField(new Date(o.created_at).toLocaleString("pt-BR")),
        csvField(table?.label ?? "—"),
        csvField(o.customer_name ?? ""),
        csvField(o.status),
        csvField((o.total_cents / 100).toFixed(2).replace(".", ",")),
        csvField(o.paid_at ? "Sim" : "Não"),
      ].join(";"),
    );
  }

  const csv = "﻿" + lines.join("\r\n");
  const filename = `balanco-${period}-${to.toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
