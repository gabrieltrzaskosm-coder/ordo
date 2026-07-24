import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ItemEditor,
  type EditableGroup,
  type RecipeLine,
} from "./ItemEditor";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const session = await requireManager();
  const supabase = await createClient();

  // RLS restringe ao estabelecimento do staff.
  const { data: item } = await supabase
    .from("menu_items")
    .select("id, name, price_cents, image_url")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) notFound();

  const { data: groups } = await supabase
    .from("modifier_groups")
    .select("id, name, min_select, max_select, sort")
    .eq("menu_item_id", itemId)
    .order("sort", { ascending: true });

  const { data: modifiers } = await supabase
    .from("modifiers")
    .select("id, group_id, name, price_delta_cents, sort")
    .order("sort", { ascending: true });

  // Ingredientes do estabelecimento (para as caixas de seleção) e as receitas
  // já ligadas a este prato e aos seus extras.
  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, name")
    .eq("establishment_id", session.establishmentId)
    .order("name", { ascending: true });

  const { data: recipes } = await supabase
    .from("recipe_items")
    .select("id, ingredient_id, menu_item_id, modifier_id, qty")
    .eq("establishment_id", session.establishmentId);

  const ingName = new Map((ingredients ?? []).map((i) => [i.id, i.name]));
  const toLine = (r: {
    id: string;
    ingredient_id: string;
    qty: number;
  }): RecipeLine => ({
    recipeId: r.id,
    ingredientId: r.ingredient_id,
    name: ingName.get(r.ingredient_id) ?? "—",
    qty: r.qty,
  });

  const itemRecipe: RecipeLine[] = (recipes ?? [])
    .filter((r) => r.menu_item_id === itemId)
    .map(toLine);

  const modRecipe = new Map<string, RecipeLine[]>();
  for (const r of recipes ?? []) {
    if (!r.modifier_id) continue;
    const l = modRecipe.get(r.modifier_id) ?? [];
    l.push(toLine(r));
    modRecipe.set(r.modifier_id, l);
  }

  const editableGroups: EditableGroup[] = (groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    // single = obrigatório escolher 1 (min 1, max 1); caso contrário múltiplo.
    single: g.min_select === 1 && g.max_select === 1,
    modifiers: (modifiers ?? [])
      .filter((m) => m.group_id === g.id)
      .map((m) => ({
        id: m.id,
        name: m.name,
        priceDeltaCents: m.price_delta_cents,
        recipe: modRecipe.get(m.id) ?? [],
      })),
  }));

  return (
    <ItemEditor
      itemId={item.id}
      name={item.name}
      imageUrl={item.image_url}
      groups={editableGroups}
      ingredients={ingredients ?? []}
      itemRecipe={itemRecipe}
    />
  );
}
