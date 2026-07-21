import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MenuManager, type ManagedCategory } from "./MenuManager";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  await requireManager();
  const supabase = await createClient();

  // A RLS restringe ao estabelecimento do staff — sem filtro manual.
  const { data: categories } = await supabase
    .from("menu_categories")
    .select("id, name, sort")
    .order("sort", { ascending: true });

  const { data: items } = await supabase
    .from("menu_items")
    .select("id, name, description, price_cents, available, category_id, sort, vat_code")
    .order("sort", { ascending: true });

  const managed: ManagedCategory[] = (categories ?? []).map((c) => ({
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
        vatCode: i.vat_code,
      })),
  }));

  return <MenuManager categories={managed} />;
}
