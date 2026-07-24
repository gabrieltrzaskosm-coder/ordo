"use server";

// Inventário de ingredientes (plano Max). requirePlan("max") garante manager +
// plano; a RLS de `ingredients` só deixa o manager do próprio estabelecimento
// escrever. A receita (que prato/extra gasta cada ingrediente) edita-se na
// página do prato — ver gestao/menu/[itemId].
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePlan } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: boolean; error?: string };

const qtySchema = z.number().int().min(0).max(100000);

export async function createIngredient(name: string): Promise<ActionResult> {
  const session = await requirePlan("max");
  const parsed = z.string().trim().min(1).max(60).safeParse(name);
  if (!parsed.success) return { ok: false, error: "Nome inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("ingredients").insert({
    establishment_id: session.establishmentId,
    name: parsed.data,
  });
  if (error) return { ok: false, error: "Falha ao criar o ingrediente." };
  revalidatePath("/gestao/ingredientes");
  return { ok: true };
}

export async function deleteIngredient(id: string): Promise<ActionResult> {
  await requirePlan("max");
  const supabase = await createClient();
  // As linhas de receita que o usam saem em cascata (FK on delete cascade), por
  // isso o prato/extra volta a ficar sem esse ingrediente.
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) return { ok: false, error: "Falha ao remover o ingrediente." };
  revalidatePath("/gestao/ingredientes");
  return { ok: true };
}

export async function setIngredientStock(
  id: string,
  qty: number,
): Promise<ActionResult> {
  await requirePlan("max");
  const parsed = qtySchema.safeParse(qty);
  if (!parsed.success) return { ok: false, error: "Quantidade inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ingredients")
    .update({ stock_qty: parsed.data })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao atualizar o stock." };
  revalidatePath("/gestao/ingredientes");
  return { ok: true };
}

export async function setIngredientThreshold(
  id: string,
  threshold: number,
): Promise<ActionResult> {
  await requirePlan("max");
  const parsed = qtySchema.safeParse(threshold);
  if (!parsed.success) return { ok: false, error: "Valor inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ingredients")
    .update({ low_stock_threshold: parsed.data })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao atualizar o alerta." };
  revalidatePath("/gestao/ingredientes");
  return { ok: true };
}
