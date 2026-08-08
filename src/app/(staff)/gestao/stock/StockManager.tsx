"use client";

import { useState, useTransition } from "react";
import { setTrackStock, setStockQty, setThreshold } from "./actions";

export type StockItem = {
  id: string;
  name: string;
  category: string;
  trackStock: boolean;
  stockQty: number;
  threshold: number;
};

export function StockManager({ items }: { items: StockItem[] }) {
  const [rows, setRows] = useState(items);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function patch(id: string, next: Partial<StockItem>) {
    setRows((r) => r.map((i) => (i.id === id ? { ...i, ...next } : i)));
  }

  function run(
    id: string,
    optimistic: Partial<StockItem>,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    revert: Partial<StockItem>,
  ) {
    setError(null);
    patch(id, optimistic);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        patch(id, revert);
        setError(res.error ?? "Algo correu mal.");
      }
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-2xl border border-brand/30 bg-brand-weak p-3 text-sm text-brand-strong">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-[22px] border border-line bg-surface shadow-[var(--shadow-card)]">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
          <div className="flex-1">Item</div>
          <div className="w-[150px] text-center">Estoque</div>
          <div className="w-[92px] text-center">Alerta</div>
          <div className="w-[52px] text-center">Segue</div>
        </div>

        {rows.map((it) => {
          const status = !it.trackStock
            ? null
            : it.stockQty === 0
              ? { label: "esgotado", cls: "bg-brand-weak text-brand-strong" }
              : it.stockQty <= it.threshold
                ? { label: "baixo", cls: "bg-warn-weak text-warn" }
                : null;
          const qtyColor = !it.trackStock
            ? "var(--color-muted)"
            : it.stockQty === 0
              ? "#d41d0d"
              : it.stockQty <= it.threshold
                ? "#b45309"
                : "var(--color-ink)";

          return (
            <div
              key={it.id}
              className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0"
              style={{ opacity: it.trackStock ? 1 : 0.55 }}
            >
              {/* Item */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-bold text-ink">
                    {it.name}
                  </span>
                  {status && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  )}
                </div>
                <div className="truncate text-[11.5px] text-muted">
                  {it.category}
                </div>
              </div>

              {/* Estoque (stepper) */}
              <div className="flex w-[150px] items-center justify-center gap-1">
                {it.trackStock ? (
                  <>
                    <button
                      disabled={pending || it.stockQty === 0}
                      onClick={() =>
                        run(
                          it.id,
                          { stockQty: it.stockQty - 1 },
                          () => setStockQty(it.id, it.stockQty - 1),
                          { stockQty: it.stockQty },
                        )
                      }
                      className="grid h-7 w-7 place-items-center rounded-full border border-line text-ink transition active:scale-90 disabled:opacity-30"
                      aria-label="Menos um"
                    >
                      −
                    </button>
                    <span
                      className="tnum w-8 text-center text-[15px] font-extrabold"
                      style={{ color: qtyColor }}
                    >
                      {it.stockQty}
                    </span>
                    <button
                      disabled={pending}
                      onClick={() =>
                        run(
                          it.id,
                          { stockQty: it.stockQty + 1 },
                          () => setStockQty(it.id, it.stockQty + 1),
                          { stockQty: it.stockQty },
                        )
                      }
                      className="grid h-7 w-7 place-items-center rounded-full border border-line text-ink transition active:scale-90"
                      aria-label="Mais um"
                    >
                      +
                    </button>
                    <button
                      disabled={pending}
                      onClick={() =>
                        run(
                          it.id,
                          { stockQty: it.stockQty + 10 },
                          () => setStockQty(it.id, it.stockQty + 10),
                          { stockQty: it.stockQty },
                        )
                      }
                      className="ml-0.5 rounded-full border border-line px-1.5 py-1 text-[10px] font-bold text-muted transition active:scale-95"
                    >
                      +10
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-muted">—</span>
                )}
              </div>

              {/* Alerta (limiar) */}
              <div className="flex w-[92px] justify-center">
                {it.trackStock ? (
                  <input
                    type="number"
                    min={0}
                    defaultValue={it.threshold}
                    onBlur={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!Number.isNaN(n) && n !== it.threshold) {
                        run(
                          it.id,
                          { threshold: n },
                          () => setThreshold(it.id, n),
                          { threshold: it.threshold },
                        );
                      }
                    }}
                    className="tnum w-16 rounded-lg border border-line bg-canvas px-2 py-1.5 text-center text-sm font-semibold text-ink"
                  />
                ) : (
                  <span className="text-sm text-muted">—</span>
                )}
              </div>

              {/* Segue (toggle) */}
              <div className="flex w-[52px] justify-center">
                <button
                  disabled={pending}
                  onClick={() =>
                    run(
                      it.id,
                      { trackStock: !it.trackStock },
                      () => setTrackStock(it.id, !it.trackStock),
                      { trackStock: it.trackStock },
                    )
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    it.trackStock ? "bg-brand" : "bg-surface-2"
                  }`}
                  aria-pressed={it.trackStock}
                  aria-label="Seguir estoque"
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      it.trackStock ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <p className="p-8 text-center text-sm text-muted">
            Nenhum item no cardápio ainda.
          </p>
        )}
      </div>
    </div>
  );
}
