"use client";

import { useState, useTransition } from "react";
import {
  createIngredient,
  deleteIngredient,
  setIngredientStock,
  setIngredientThreshold,
} from "./actions";

export type Ingredient = {
  id: string;
  name: string;
  stockQty: number;
  threshold: number;
  usedBy: number; // em quantos pratos/extras entra (para avisar ao remover)
};

export function IngredientsManager({ items }: { items: Ingredient[] }) {
  const [rows, setRows] = useState(items);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  function patch(id: string, next: Partial<Ingredient>) {
    setRows((r) => r.map((i) => (i.id === id ? { ...i, ...next } : i)));
  }

  function run(
    id: string,
    optimistic: Partial<Ingredient>,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    revert: Partial<Ingredient>,
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

  function add() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const res = await createIngredient(name);
      if (res.ok) {
        setNewName("");
        // O id real vem no próximo carregamento; mostra já uma linha otimista.
        setRows((r) => [
          ...r,
          {
            id: `tmp-${Date.now()}`,
            name,
            stockQty: 0,
            threshold: 5,
            usedBy: 0,
          },
        ]);
      } else {
        setError(res.error ?? "Falha ao criar o ingrediente.");
      }
    });
  }

  function remove(it: Ingredient) {
    const msg = it.usedBy
      ? `Remover "${it.name}"? Sai de ${it.usedBy} prato(s)/extra(s) que o usam.`
      : `Remover "${it.name}"?`;
    if (typeof window !== "undefined" && !window.confirm(msg)) return;
    setError(null);
    setRows((r) => r.filter((i) => i.id !== it.id));
    startTransition(async () => {
      const res = await deleteIngredient(it.id);
      if (!res.ok) {
        setRows((r) => [...r, it]);
        setError(res.error ?? "Falha ao remover.");
      }
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}

      {/* Adicionar ingrediente */}
      <div className="mb-5 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Novo ingrediente (ex.: Pão, Bacon, Queijo)"
          className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand/50"
        />
        <button
          onClick={add}
          disabled={pending || newName.trim() === ""}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink transition hover:opacity-90 disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Sem ingredientes. Crie um acima e depois ligue-o a um prato na página do
          prato (Menu → prato → Receita).
        </p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((it) => {
            const isTmp = it.id.startsWith("tmp-");
            const status =
              it.stockQty === 0
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
                    <p className="text-xs text-muted">
                      {it.usedBy
                        ? `em ${it.usedBy} prato(s)/extra(s)`
                        : "ainda sem receita"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}
                    >
                      {status.label}
                    </span>
                    <button
                      disabled={pending || isTmp}
                      onClick={() => remove(it)}
                      className="text-xs text-muted transition hover:text-red-700 disabled:opacity-40"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">Stock</span>
                    <div className="flex items-center gap-1 rounded-full border border-line p-0.5">
                      <button
                        disabled={pending || isTmp || it.stockQty === 0}
                        onClick={() =>
                          run(
                            it.id,
                            { stockQty: it.stockQty - 1 },
                            () => setIngredientStock(it.id, it.stockQty - 1),
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
                        disabled={pending || isTmp}
                        onClick={() =>
                          run(
                            it.id,
                            { stockQty: it.stockQty + 1 },
                            () => setIngredientStock(it.id, it.stockQty + 1),
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
                      disabled={pending || isTmp}
                      onClick={() =>
                        run(
                          it.id,
                          { stockQty: it.stockQty + 10 },
                          () => setIngredientStock(it.id, it.stockQty + 10),
                          { stockQty: it.stockQty },
                        )
                      }
                      className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink transition active:scale-95 disabled:opacity-40"
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
                      disabled={isTmp}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!Number.isNaN(n) && n !== it.threshold) {
                          run(
                            it.id,
                            { threshold: n },
                            () => setIngredientThreshold(it.id, n),
                            { threshold: it.threshold },
                          );
                        }
                      }}
                      className="tnum w-16 rounded-lg border border-line px-2 py-1 text-sm text-ink"
                    />
                    un.
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
