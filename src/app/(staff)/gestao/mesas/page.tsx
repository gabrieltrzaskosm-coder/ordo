import QRCode from "qrcode";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { TablesManager, type ManagedTable } from "./TablesManager";

export const dynamic = "force-dynamic";

export default async function MesasPage() {
  await requireManager();
  const supabase = await createClient();

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, label, qr_token, active")
    .order("label", { ascending: true });

  // QR gerado no servidor: o token nunca precisa de ir para um serviço externo
  // de geração de imagens.
  const managed: ManagedTable[] = await Promise.all(
    (tables ?? []).map(async (t) => {
      const url = `${publicEnv.appUrl}/mesa/${t.qr_token}`;
      return {
        id: t.id,
        label: t.label,
        active: t.active,
        url,
        qrDataUrl: await QRCode.toDataURL(url, { width: 320, margin: 1 }),
      };
    }),
  );

  return <TablesManager tables={managed} appUrl={publicEnv.appUrl} />;
}
