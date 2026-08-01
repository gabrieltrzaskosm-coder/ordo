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
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}

      <ul className="space-y-2.5">
        {rows.map((it) => {
          const status = !it.trackStock
            ? null
            : it.stockQty === 0
              ? { label: "Esgotado", cls: "bg-warn-weak text-warn" }
              : it.stockQty <= it.threshold
                ? { label: "Em ruptura", cls: "bg-surface-2 text-ink" }
                : { label: "Em estoque", cls: "bg-success-weak text-success" };

          return (
            <li
              key={it.id}
              className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{it.name}</p>
                  <p className="text-xs text-muted">{it.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {status && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  )}
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
                    {/*
                      `left-0.5` é obrigatório: sem âncora horizontal o polegar
                      cai na static position e, como o <button> tem
                      text-align:center por omissão, essa posição é o CENTRO do
                      track — ligado, saía 18px para fora da pílula.
                      Track 44 − polegar 20 − 2 de folga = 20px de curso.
                    */}
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform ${
                        it.trackStock ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {it.trackStock && (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">Stock</span>
                    <div className="flex items-center gap-1 rounded-full border border-line p-0.5">
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
                        className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition active:scale-90 disabled:opacity-30"
                        aria-label="Menos um"
                      >
                        −
                      </button>
                      <span className="tnum w-8 text-center text-sm font-semibold text-ink">
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
                        className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition active:scale-90"
                        aria-label="Mais um"
                      >
                        +
                      </button>
                    </div>
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
                      className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink transition active:scale-95"
                    >
                      +10
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-muted">
                    Alerta a
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
                      className="tnum w-16 rounded-lg border border-line px-2 py-1 text-sm text-ink"
                    />
                    un.
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
