"use server";

// CRUD do menu. Usa o cliente autenticado: a RLS já restringe a escrita a
// owner/manager do próprio estabelecimento. requireManager() dá a mensagem
// certa cedo em vez de deixar a RLS falhar em silêncio.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth";

export type ActionResult = { ok: boolean; error?: string };

/** Aceita "8,50" ou "8.50" e devolve cêntimos. */
function parsePriceToCents(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(parseFloat(normalized) * 100);
}

const categorySchema = z.object({ name: z.string().trim().min(1).max(60) });

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const session = await requireManager();
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { ok: false, error: "Nome inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("menu_categories").insert({
    establishment_id: session.establishmentId,
    name: parsed.data.name,
  });
  if (error) return { ok: false, error: "Falha ao criar a categoria." };

  revalidatePath("/gestao/menu");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  // Os pratos da categoria caem por ON DELETE CASCADE.
  const { error } = await supabase.from("menu_categories").delete().eq("id", id);
  if (error) return { ok: false, error: "Falha ao remover." };

  revalidatePath("/gestao/menu");
  return { ok: true };
}

const itemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200).optional(),
  price: z.string(),
});

export async function createItem(formData: FormData): Promise<ActionResult> {
  const session = await requireManager();
  const parsed = itemSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const cents = parsePriceToCents(parsed.data.price);
  if (cents === null) return { ok: false, error: "Preço inválido (ex.: 8,50)." };

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").insert({
    establishment_id: session.establishmentId,
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    price_cents: cents,
  });
  if (error) return { ok: false, error: "Falha ao criar o prato." };

  revalidatePath("/gestao/menu");
  return { ok: true };
}

export async function updateItemPrice(
  id: string,
  price: string,
): Promise<ActionResult> {
  await requireManager();
  const cents = parsePriceToCents(price);
  if (cents === null) return { ok: false, error: "Preço inválido (ex.: 8,50)." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ price_cents: cents })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao atualizar o preço." };

  revalidatePath("/gestao/menu");
  return { ok: true };
}

export async function setItemAvailability(
  id: string,
  available: boolean,
): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ available })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao atualizar." };

  revalidatePath("/gestao/menu");
  return { ok: true };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) return { ok: false, error: "Falha ao remover." };

  revalidatePath("/gestao/menu");
  return { ok: true };
}
