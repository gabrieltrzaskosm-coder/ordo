"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth";

export type ActionResult = { ok: boolean; error?: string };

const labelSchema = z.object({ label: z.string().trim().min(1).max(40) });

export async function createTable(formData: FormData): Promise<ActionResult> {
  const session = await requireManager();
  const parsed = labelSchema.safeParse({ label: formData.get("label") });
  if (!parsed.success) return { ok: false, error: "Nome da mesa inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("restaurant_tables").insert({
    establishment_id: session.establishmentId,
    label: parsed.data.label,
    qr_token: randomBytes(16).toString("hex"),
  });
  if (error) return { ok: false, error: "Falha ao criar a mesa." };

  revalidatePath("/gestao/mesas");
  return { ok: true };
}

/**
 * Rotaciona o qr_token. Invalida o QR antigo de imediato — usar se um código
 * for exposto/fotografado indevidamente. Obriga a reimprimir o código da mesa.
 */
export async function regenerateToken(id: string): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_tables")
    .update({ qr_token: randomBytes(16).toString("hex") })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao gerar novo código." };

  revalidatePath("/gestao/mesas");
  return { ok: true };
}

export async function setTableActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_tables")
    .update({ active })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao atualizar." };

  revalidatePath("/gestao/mesas");
  return { ok: true };
}

export async function deleteTable(id: string): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
  // orders.table_id não tem cascade: mesas com histórico de pedidos não podem
  // ser apagadas. Desativar é o caminho certo.
  if (error) {
    return {
      ok: false,
      error: "Esta mesa tem pedidos associados. Desative-a em vez de remover.",
    };
  }

  revalidatePath("/gestao/mesas");
  return { ok: true };
}
