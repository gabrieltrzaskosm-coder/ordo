// Leitura do menu público de um estabelecimento (usado no fluxo do cliente).
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type MenuModifier = {
  id: string;
  name: string;
  priceDeltaCents: number;
};

export type MenuModifierGroup = {
  id: string;
  name: string;
  single: boolean; // escolha única obrigatória vs múltipla opcional
  modifiers: MenuModifier[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  available: boolean;
  imageUrl: string | null;
  groups: MenuModifierGroup[];
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export async function getMenu(establishmentId: string): Promise<MenuCategory[]> {
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from("menu_categories")
    .select("id, name, sort")
    .eq("establishment_id", establishmentId)
    .order("sort", { ascending: true });

  if (!categories?.length) return [];

  const { data: items } = await supabase
    .from("menu_items")
    .select(
      "id, name, description, price_cents, available, image_url, category_id, sort",
    )
    .eq("establishment_id", establishmentId)
    .order("sort", { ascending: true });

  const { data: groups } = await supabase
    .from("modifier_groups")
    .select("id, menu_item_id, name, min_select, max_select, sort")
    .eq("establishment_id", establishmentId)
    .order("sort", { ascending: true });

  const { data: modifiers } = await supabase
    .from("modifiers")
    .select("id, group_id, name, price_delta_cents, available, sort")
    .eq("establishment_id", establishmentId)
    .eq("available", true)
    .order("sort", { ascending: true });

  const groupsByItem = new Map<string, MenuModifierGroup[]>();
  for (const g of groups ?? []) {
    const list = groupsByItem.get(g.menu_item_id) ?? [];
    list.push({
      id: g.id,
      name: g.name,
      single: g.min_select === 1 && g.max_select === 1,
      modifiers: (modifiers ?? [])
        .filter((m) => m.group_id === g.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          priceDeltaCents: m.price_delta_cents,
        })),
    });
    groupsByItem.set(g.menu_item_id, list);
  }

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    items: (items ?? [])
      .filter((i) => i.category_id === c.id)
      .map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        priceCents: i.price_cents,
        available: i.available,
        imageUrl: i.image_url,
        groups: groupsByItem.get(i.id) ?? [],
      })),
  }));
}
