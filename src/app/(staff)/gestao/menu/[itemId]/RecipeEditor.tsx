"use client";

// Lista de ingredientes de uma receita (de um prato ou de um extra), com o que
// adicionar/remover. Apresentacional: recebe as linhas e os handlers; quem grava
// é o ItemEditor (via server actions). Reutilizado nos dois sítios.
import { useState } from "react";
import Link from "next/link";
import type { RecipeLine, IngredientOption } from "./ItemEditor";

export function RecipeEditor({
  lines,
  ingredients,
  disabled,
  compact = false,
  onAdd,
  onRemove,
}: {
  lines: RecipeLine[];
  ingredients: IngredientOption[];
  disabled: boolean;
  compact?: boolean;
  onAdd: (ingredientId: string, qty: number) => void;
  onRemove: (recipeId: string) => void;
}) {
  const [ingredientId, setIngredientId] = useState("");
  const [qty, setQty] = useState("1");

  // Só ingredientes ainda não usados nesta receita ficam disponíveis para juntar.
  const used = new Set(lines.map((l) => l.ingredientId));
  const available = ingredients.filter((i) => !used.has(i.id));

  function submit() {
    const n = parseInt(qty, 10);
    if (!ingredientId || Number.isNaN(n) || n < 1) return;
    onAdd(ingredientId, n);
    setIngredientId("");
    setQty("1");
  }

  if (ingredients.length === 0) {
    return (
      <p className={`text-muted ${compact ? "text-xs" : "text-sm"}`}>
        Ainda não há ingredientes.{" "}
        <Link href="/gestao/ingredientes" className="underline">
          Criar ingredientes
        </Link>
        .
      </p>
    );
  }

  return (
    <div>
      {lines.length > 0 && (
        <ul className={compact ? "mb-2 space-y-1" : "mb-3 space-y-1.5"}>
          {lines.map((l) => (
            <li
              key={l.recipeId}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="text-ink">
                {l.name}
                <span className="text-muted"> × {l.qty}</span>
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemove(l.recipeId)}
                className="text-xs text-muted transition hover:text-red-700 disabled:opacity-40"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
            disabled={disabled}
            className="flex-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
          >
            <option value="">Ingrediente…</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            disabled={disabled}
            aria-label="Quantidade"
            className="tnum w-16 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
          />
          <button
            type="button"
            disabled={disabled || ingredientId === ""}
            onClick={submit}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink transition hover:border-brand/40 disabled:opacity-40"
          >
            Juntar
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted">Todos os ingredientes já estão na receita.</p>
      )}
    </div>
  );
}
