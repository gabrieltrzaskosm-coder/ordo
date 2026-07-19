// Resolução da "sessão de mesa" do cliente anónimo a partir do qr_token.
// Este é o ponto único onde um qr_token é traduzido para mesa + estabelecimento.
// Todo o código do cliente (menu, pedido, chamar atendente) deve começar aqui e
// restringir as operações ao establishment_id/table_id devolvidos.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type TableSession = {
  tableId: string;
  establishmentId: string;
  establishmentName: string;
  currency: string;
  tableLabel: string;
};

export async function resolveTableSession(
  qrToken: string,
): Promise<TableSession | null> {
  if (!qrToken) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select(
      "id, label, active, establishment_id, establishments(name, currency)",
    )
    .eq("qr_token", qrToken)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;

  const est = data.establishments as unknown as {
    name: string;
    currency: string;
  } | null;
  if (!est) return null;

  return {
    tableId: data.id,
    establishmentId: data.establishment_id,
    establishmentName: est.name,
    currency: est.currency,
    tableLabel: data.label,
  };
}
