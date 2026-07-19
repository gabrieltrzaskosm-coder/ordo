import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ItemEditor, type EditableGroup } from "./ItemEditor";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  await requireManager();
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
      })),
  }));

  return (
    <ItemEditor
      itemId={item.id}
      name={item.name}
      imageUrl={item.image_url}
      groups={editableGroups}
    />
  );
}
