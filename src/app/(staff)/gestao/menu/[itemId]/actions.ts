"use server";

// Edição de um prato: imagem e grupos de opções. Escrita via admin client (para
// storage e para simplificar), SEMPRE confirmando que o prato/grupo é do
// estabelecimento da sessão (requireManager) antes de tocar em algo.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireManager } from "@/lib/auth";

export type ActionResult = { ok: boolean; error?: string };

const BUCKET = "menu-images";

async function assertItem(itemId: string, establishmentId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("menu_items")
    .select("id, establishment_id, image_url")
    .eq("id", itemId)
    .maybeSingle();
  if (!data || data.establishment_id !== establishmentId) return null;
  return data;
}

export async function uploadItemImage(
  itemId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireManager();
  const item = await assertItem(itemId, session.establishmentId);
  if (!item) return { ok: false, error: "Prato não encontrado." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Escolha uma imagem." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Imagem demasiado grande (máx. 5 MB)." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "O ficheiro tem de ser uma imagem." };
  }

  const admin = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${session.establishmentId}/${itemId}-${Date.now()}.${ext}`;

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return { ok: false, error: "Falha ao carregar a imagem." };

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  await admin
    .from("menu_items")
    .update({ image_url: pub.publicUrl })
    .eq("id", itemId);

  revalidatePath(`/gestao/menu/${itemId}`);
  revalidatePath("/gestao/menu");
  return { ok: true };
}

export async function removeItemImage(itemId: string): Promise<ActionResult> {
  const session = await requireManager();
  const item = await assertItem(itemId, session.establishmentId);
  if (!item) return { ok: false, error: "Prato não encontrado." };

  const admin = createAdminClient();
  await admin.from("menu_items").update({ image_url: null }).eq("id", itemId);
  revalidatePath(`/gestao/menu/${itemId}`);
  revalidatePath("/gestao/menu");
  return { ok: true };
}

// ---------- Grupos de opções ----------
const groupSchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.enum(["single", "multi"]),
});

export async function createGroup(
  itemId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireManager();
  const item = await assertItem(itemId, session.establishmentId);
  if (!item) return { ok: false, error: "Prato não encontrado." };

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  // single = escolha única obrigatória (1..1); multi = várias opcionais (0..N).
  const single = parsed.data.type === "single";
  const admin = createAdminClient();
  const { error } = await admin.from("modifier_groups").insert({
    establishment_id: session.establishmentId,
    menu_item_id: itemId,
    name: parsed.data.name,
    min_select: single ? 1 : 0,
    max_select: single ? 1 : 99,
  });
  if (error) return { ok: false, error: "Falha ao criar o grupo." };

  revalidatePath(`/gestao/menu/${itemId}`);
  return { ok: true };
}

export async function deleteGroup(
  itemId: string,
  groupId: string,
): Promise<ActionResult> {
  const session = await requireManager();
  const admin = createAdminClient();
  // Confirma que o grupo é do estabelecimento antes de apagar (cascata p/ modifiers).
  const { data: g } = await admin
    .from("modifier_groups")
    .select("id, establishment_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!g || g.establishment_id !== session.establishmentId) {
    return { ok: false, error: "Grupo não encontrado." };
  }
  await admin.from("modifier_groups").delete().eq("id", groupId);
  revalidatePath(`/gestao/menu/${itemId}`);
  return { ok: true };
}

// ---------- Opções ----------
const modifierSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
  price: z.string(),
});

function parsePriceToCents(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (s === "") return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 100);
}

export async function createModifier(
  itemId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireManager();
  const parsed = modifierSchema.safeParse({
    groupId: formData.get("groupId"),
    name: formData.get("name"),
    price: formData.get("price") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const cents = parsePriceToCents(parsed.data.price);
  if (cents === null) return { ok: false, error: "Preço inválido (ex.: 1,50)." };

  const admin = createAdminClient();
  const { data: g } = await admin
    .from("modifier_groups")
    .select("id, establishment_id")
    .eq("id", parsed.data.groupId)
    .maybeSingle();
  if (!g || g.establishment_id !== session.establishmentId) {
    return { ok: false, error: "Grupo não encontrado." };
  }

  const { error } = await admin.from("modifiers").insert({
    establishment_id: session.establishmentId,
    group_id: parsed.data.groupId,
    name: parsed.data.name,
    price_delta_cents: cents,
  });
  if (error) return { ok: false, error: "Falha ao criar a opção." };

  revalidatePath(`/gestao/menu/${itemId}`);
  return { ok: true };
}

export async function deleteModifier(
  itemId: string,
  modifierId: string,
): Promise<ActionResult> {
  const session = await requireManager();
  const admin = createAdminClient();
  const { data: m } = await admin
    .from("modifiers")
    .select("id, establishment_id")
    .eq("id", modifierId)
    .maybeSingle();
  if (!m || m.establishment_id !== session.establishmentId) {
    return { ok: false, error: "Opção não encontrada." };
  }
  await admin.from("modifiers").delete().eq("id", modifierId);
  revalidatePath(`/gestao/menu/${itemId}`);
  return { ok: true };
}

// ---------- Receita (ingredientes que o prato / extra gasta) ----------
const recipeQtySchema = z.number().int().min(1).max(1000);

async function assertIngredient(id: string, establishmentId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ingredients")
    .select("id, establishment_id")
    .eq("id", id)
    .maybeSingle();
  return data && data.establishment_id === establishmentId ? data : null;
}

/**
 * Liga um ingrediente ao prato (ou atualiza a quantidade, se já estiver ligado).
 * Contagem simples: `qty` são unidades do ingrediente por prato vendido.
 */
export async function setItemIngredient(
  itemId: string,
  ingredientId: string,
  qty: number,
): Promise<ActionResult> {
  const session = await requireManager();
  const item = await assertItem(itemId, session.establishmentId);
  if (!item) return { ok: false, error: "Prato não encontrado." };
  const q = recipeQtySchema.safeParse(qty);
  if (!q.success) return { ok: false, error: "Quantidade inválida." };
  if (!(await assertIngredient(ingredientId, session.establishmentId))) {
    return { ok: false, error: "Ingrediente não encontrado." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("recipe_items")
    .select("id")
    .eq("menu_item_id", itemId)
    .eq("ingredient_id", ingredientId)
    .maybeSingle();

  const { error } = existing
    ? await admin.from("recipe_items").update({ qty: q.data }).eq("id", existing.id)
    : await admin.from("recipe_items").insert({
        establishment_id: session.establishmentId,
        ingredient_id: ingredientId,
        menu_item_id: itemId,
        qty: q.data,
      });
  if (error) return { ok: false, error: "Falha ao gravar a receita." };
  revalidatePath(`/gestao/menu/${itemId}`);
  return { ok: true };
}

/** Liga um ingrediente a um extra (ou atualiza a quantidade). */
export async function setModifierIngredient(
  itemId: string,
  modifierId: string,
  ingredientId: string,
  qty: number,
): Promise<ActionResult> {
  const session = await requireManager();
  const q = recipeQtySchema.safeParse(qty);
  if (!q.success) return { ok: false, error: "Quantidade inválida." };
  if (!(await assertIngredient(ingredientId, session.establishmentId))) {
    return { ok: false, error: "Ingrediente não encontrado." };
  }

  const admin = createAdminClient();
  const { data: mod } = await admin
    .from("modifiers")
    .select("id, establishment_id")
    .eq("id", modifierId)
    .maybeSingle();
  if (!mod || mod.establishment_id !== session.establishmentId) {
    return { ok: false, error: "Extra não encontrado." };
  }

  // Qualquer opção pode levar ingredientes, obrigatória ou não: o que decide é
  // se consome algo físico (a bebida de um combo sim; o ponto da carne não —
  // mas isso é escolha de quem configura, não uma regra a impor aqui). Se um
  // grupo obrigatório ficar sem opções por stock, o getMenu esconde o prato.

  const { data: existing } = await admin
    .from("recipe_items")
    .select("id")
    .eq("modifier_id", modifierId)
    .eq("ingredient_id", ingredientId)
    .maybeSingle();

  const { error } = existing
    ? await admin.from("recipe_items").update({ qty: q.data }).eq("id", existing.id)
    : await admin.from("recipe_items").insert({
        establishment_id: session.establishmentId,
        ingredient_id: ingredientId,
        modifier_id: modifierId,
        qty: q.data,
      });
  if (error) return { ok: false, error: "Falha ao gravar a receita." };
  revalidatePath(`/gestao/menu/${itemId}`);
  return { ok: true };
}

/** Remove uma linha de receita (de prato ou de extra). */
export async function removeRecipeItem(
  itemId: string,
  recipeId: string,
): Promise<ActionResult> {
  const session = await requireManager();
  const admin = createAdminClient();
  const { data } = await admin
    .from("recipe_items")
    .select("id, establishment_id")
    .eq("id", recipeId)
    .maybeSingle();
  if (!data || data.establishment_id !== session.establishmentId) {
    return { ok: false, error: "Linha não encontrada." };
  }
  await admin.from("recipe_items").delete().eq("id", recipeId);
  revalidatePath(`/gestao/menu/${itemId}`);
  return { ok: true };
}
