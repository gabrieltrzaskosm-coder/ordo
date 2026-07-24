import Link from "next/link";
import { requirePlan } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StockManager, type StockItem } from "./StockManager";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  await requirePlan("max");
  const supabase = await createClient();

  const { data: cats } = await supabase
    .from("menu_categories")
    .select("id, name, sort")
    .order("sort", { ascending: true });

  const { data: items } = await supabase
    .from("menu_items")
    .select(
      "id, name, category_id, track_stock, stock_qty, low_stock_threshold, sort",
    )
    .order("sort", { ascending: true });

  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));

  const stockItems: StockItem[] = (items ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    category: catName.get(i.category_id) ?? "—",
    trackStock: i.track_stock,
    stockQty: i.stock_qty,
    threshold: i.low_stock_threshold,
  }));

  const tracked = stockItems.filter((i) => i.trackStock);
  const out = tracked.filter((i) => i.stockQty === 0).length;
  const low = tracked.filter(
    (i) => i.stockQty > 0 && i.stockQty <= i.threshold,
  ).length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Gestão de stock</h1>
        <Link href="/gestao" className="text-sm text-muted hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Ligue o stock por artigo. A zero, fica esgotado no menu automaticamente e
        volta a aparecer ao repor.
      </p>

      <Link
        href="/gestao/ingredientes"
        className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow-card)] transition hover:border-brand/40"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink">
            Stock por ingrediente
          </span>
          <span className="block text-xs text-muted">
            Para pratos compostos: um ingrediente partilhado (ex.: pão) esgota e
            sai de todos os pratos que o usam.
          </span>
        </span>
        <span className="ml-3 shrink-0 text-muted">→</span>
      </Link>

      {(out > 0 || low > 0) && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {out > 0 && (
            <span className="rounded-full bg-warn-weak px-3 py-1 font-medium text-warn">
              {out} esgotado{out > 1 ? "s" : ""}
            </span>
          )}
          {low > 0 && (
            <span className="rounded-full bg-surface-2 px-3 py-1 font-medium text-ink">
              {low} em rutura
            </span>
          )}
        </div>
      )}

      <div className="mt-6">
        <StockManager items={stockItems} />
      </div>
    </main>
  );
}
