"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import {
  createGroup,
  createModifier,
  deleteGroup,
  deleteModifier,
  removeItemImage,
  removeRecipeItem,
  setItemIngredient,
  setModifierIngredient,
  uploadItemImage,
} from "./actions";
import { RecipeEditor } from "./RecipeEditor";

export type RecipeLine = {
  recipeId: string;
  ingredientId: string;
  name: string;
  qty: number;
};

export type EditableModifier = {
  id: string;
  name: string;
  priceDeltaCents: number;
  recipe: RecipeLine[];
};

export type EditableGroup = {
  id: string;
  name: string;
  single: boolean;
  modifiers: EditableModifier[];
};

export type IngredientOption = { id: string; name: string };

export function ItemEditor({
  itemId,
  name,
  imageUrl,
  groups,
  ingredients,
  itemRecipe,
}: {
  itemId: string;
  name: string;
  imageUrl: string | null;
  groups: EditableGroup[];
  ingredients: IngredientOption[];
  itemRecipe: RecipeLine[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Algo correu mal.");
    });
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-medium">{name}</h1>
        <Link href="/gestao/menu" className="text-sm text-muted hover:underline">
          ← Menu
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Imagem e opções deste prato. Aparecem no menu do cliente.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}

      {/* ---------- Imagem ---------- */}
      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted">Imagem</h2>
        <div className="flex items-center gap-4">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="h-24 w-24 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted">
              Sem imagem
            </div>
          )}
          <form
            action={(fd) => run(() => uploadItemImage(itemId, fd))}
            className="space-y-2"
          >
            <input
              ref={fileRef}
              type="file"
              name="image"
              accept="image/*"
              required
              className="block text-sm"
            />
            <div className="flex gap-2">
              <button
                disabled={pending}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm text-brand-ink disabled:opacity-40"
              >
                Carregar
              </button>
              {imageUrl && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => removeItemImage(itemId))}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm"
                >
                  Remover
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ---------- Receita (ingredientes do prato) ---------- */}
      <section className="mb-8">
        <h2 className="mb-1 text-sm font-medium text-muted">Receita</h2>
        <p className="mb-3 text-xs text-muted">
          Ingredientes que este prato gasta (em unidades). Quando um deles esgota,
          o prato sai do menu.
        </p>
        <div className="rounded-lg border border-line p-3">
          <RecipeEditor
            lines={itemRecipe}
            ingredients={ingredients}
            disabled={pending}
            onAdd={(ingId, qty) =>
              run(() => setItemIngredient(itemId, ingId, qty))
            }
            onRemove={(rid) => run(() => removeRecipeItem(itemId, rid))}
          />
        </div>
      </section>

      {/* ---------- Grupos de opções ---------- */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-muted">Opções</h2>

        {groups.length === 0 && (
          <p className="mb-4 rounded-lg border border-dashed border-line p-4 text-sm text-muted">
            Sem opções. Crie um grupo (ex.: &quot;Ponto da carne&quot;, &quot;Retirar
            ingredientes&quot;).
          </p>
        )}

        {groups.map((g) => (
          <div key={g.id} className="mb-4 rounded-lg border border-line p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="font-medium">{g.name}</span>
                <span className="ml-2 text-xs text-muted">
                  {g.single ? "escolha única" : "múltipla"}
                </span>
              </div>
              <button
                disabled={pending}
                onClick={() => run(() => deleteGroup(itemId, g.id))}
                className="text-xs text-muted hover:text-red-700"
              >
                Remover grupo
              </button>
            </div>

            <ul className="mb-2 space-y-2">
              {g.modifiers.map((m) => (
                <li key={m.id} className="rounded-lg bg-surface-2/50 p-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {m.name}
                      {m.priceDeltaCents > 0 && (
                        <span className="text-muted">
                          {" "}
                          +{formatMoney(m.priceDeltaCents)}
                        </span>
                      )}
                    </span>
                    <button
                      disabled={pending}
                      onClick={() => run(() => deleteModifier(itemId, m.id))}
                      className="text-xs text-muted hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                  {/*
                    Ingredientes que este extra gasta (ex.: Bacon → 1 bacon).
                    Só em grupos opcionais: numa escolha obrigatória (ponto da
                    carne) não se conta stock — são formas de preparar o mesmo
                    prato, não coisas que se juntam.
                  */}
                  {!g.single && (
                    <div className="mt-2 border-t border-line pt-2">
                      <RecipeEditor
                        compact
                        lines={m.recipe}
                        ingredients={ingredients}
                        disabled={pending}
                        onAdd={(ingId, qty) =>
                          run(() =>
                            setModifierIngredient(itemId, m.id, ingId, qty),
                          )
                        }
                        onRemove={(rid) => run(() => removeRecipeItem(itemId, rid))}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <form
              action={(fd) => run(() => createModifier(itemId, fd))}
              className="flex flex-wrap gap-2"
            >
              <input type="hidden" name="groupId" value={g.id} />
              <input
                name="name"
                required
                placeholder="Opção (ex.: Mal passado, Sem cebola)"
                className="flex-1 rounded-lg border border-line px-3 py-1.5 text-sm"
              />
              <input
                name="price"
                placeholder="Extra € (opcional)"
                className="w-28 rounded-lg border border-line px-3 py-1.5 text-sm"
              />
              <button
                disabled={pending}
                className="rounded-lg border border-line px-3 text-sm"
              >
                Adicionar opção
              </button>
            </form>
          </div>
        ))}

        <form
          action={(fd) => run(() => createGroup(itemId, fd))}
          className="flex flex-wrap gap-2"
        >
          <input
            name="name"
            required
            placeholder="Novo grupo (ex.: Ponto da carne)"
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
          />
          <select
            name="type"
            defaultValue="single"
            className="rounded-lg border border-line px-3 py-2 text-sm"
          >
            <option value="single">Escolha única (obrigatória)</option>
            <option value="multi">Múltipla (opcional)</option>
          </select>
          <button
            disabled={pending}
            className="rounded-lg bg-brand px-4 text-sm text-brand-ink disabled:opacity-40"
          >
            Criar grupo
          </button>
        </form>
      </section>
    </main>
  );
}
