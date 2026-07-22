"use server";

// Gestão de stock (plano Max). requirePlan("max") bloqueia no servidor; a RLS
// de menu_items só deixa o manager do próprio estabelecimento escrever.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePlan } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: boolean; error?: string };

export async function setTrackStock(
  id: string,
  track: boolean,
): Promise<ActionResult> {
  await requirePlan("max");
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ track_stock: track })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao atualizar." };
  revalidatePath("/gestao/stock");
  return { ok: true };
}

export async function setStockQty(
  id: string,
  qty: number,
): Promise<ActionResult> {
  await requirePlan("max");
  const parsed = z.number().int().min(0).max(100000).safeParse(qty);
  if (!parsed.success) return { ok: false, error: "Quantidade inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ stock_qty: parsed.data })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao atualizar o stock." };
  revalidatePath("/gestao/stock");
  return { ok: true };
}

export async function setThreshold(
  id: string,
  threshold: number,
): Promise<ActionResult> {
  await requirePlan("max");
  const parsed = z.number().int().min(0).max(100000).safeParse(threshold);
  if (!parsed.success) return { ok: false, error: "Valor inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ low_stock_threshold: parsed.data })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao atualizar o alerta." };
  revalidatePath("/gestao/stock");
  return { ok: true };
}
