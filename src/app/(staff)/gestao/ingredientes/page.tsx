import Link from "next/link";
import { requirePlan } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { IngredientsManager, type Ingredient } from "./IngredientsManager";

export const dynamic = "force-dynamic";

export default async function IngredientesPage() {
  const session = await requirePlan("max");
  const supabase = await createClient();

  const { data: ings } = await supabase
    .from("ingredients")
    .select("id, name, stock_qty, low_stock_threshold")
    .eq("establishment_id", session.establishmentId)
    .order("name", { ascending: true });

  // Quantos pratos/extras usam cada ingrediente — para o aviso ao remover.
  const { data: recipes } = await supabase
    .from("recipe_items")
    .select("ingredient_id")
    .eq("establishment_id", session.establishmentId);

  const usedBy = new Map<string, number>();
  for (const r of recipes ?? []) {
    usedBy.set(r.ingredient_id, (usedBy.get(r.ingredient_id) ?? 0) + 1);
  }

  const rows: Ingredient[] = (ings ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    stockQty: i.stock_qty,
    threshold: i.low_stock_threshold,
    usedBy: usedBy.get(i.id) ?? 0,
  }));

  const out = rows.filter((i) => i.stockQty === 0).length;
  const low = rows.filter(
    (i) => i.stockQty > 0 && i.stockQty <= i.threshold,
  ).length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Ingredientes</h1>
        <Link href="/gestao/stock" className="text-sm text-muted hover:underline">
          ← Stock
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Stock partilhado por ingrediente. Ligue cada ingrediente aos pratos e
        extras na página do prato (Menu → prato → Receita). Quando um ingrediente
        chega a zero, sai do cardápio tudo o que precisa dele.
      </p>

      {(out > 0 || low > 0) && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {out > 0 && (
            <span className="rounded-full bg-warn-weak px-3 py-1 font-medium text-warn">
              {out} esgotado{out > 1 ? "s" : ""}
            </span>
          )}
          {low > 0 && (
            <span className="rounded-full bg-surface-2 px-3 py-1 font-medium text-ink">
              {low} em ruptura
            </span>
          )}
        </div>
      )}

      <div className="mt-6">
        <IngredientsManager items={rows} />
      </div>
    </main>
  );
}
