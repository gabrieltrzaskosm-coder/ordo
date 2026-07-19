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
  uploadItemImage,
} from "./actions";

export type EditableModifier = {
  id: string;
  name: string;
  priceDeltaCents: number;
};

export type EditableGroup = {
  id: string;
  name: string;
  single: boolean;
  modifiers: EditableModifier[];
};

export function ItemEditor({
  itemId,
  name,
  imageUrl,
  groups,
}: {
  itemId: string;
  name: string;
  imageUrl: string | null;
  groups: EditableGroup[];
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
        <Link href="/gestao/menu" className="text-sm text-neutral-500 hover:underline">
          ← Menu
        </Link>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        Imagem e opções deste prato. Aparecem no menu do cliente.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}

      {/* ---------- Imagem ---------- */}
      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-neutral-500">Imagem</h2>
        <div className="flex items-center gap-4">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="h-24 w-24 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-400">
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
                className="rounded-lg bg-black px-3 py-1.5 text-sm text-white disabled:opacity-40"
              >
                Carregar
              </button>
              {imageUrl && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => removeItemImage(itemId))}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                >
                  Remover
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ---------- Grupos de opções ---------- */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-500">Opções</h2>

        {groups.length === 0 && (
          <p className="mb-4 rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-400">
            Sem opções. Crie um grupo (ex.: &quot;Ponto da carne&quot;, &quot;Retirar
            ingredientes&quot;).
          </p>
        )}

        {groups.map((g) => (
          <div key={g.id} className="mb-4 rounded-lg border border-neutral-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="font-medium">{g.name}</span>
                <span className="ml-2 text-xs text-neutral-500">
                  {g.single ? "escolha única" : "múltipla"}
                </span>
              </div>
              <button
                disabled={pending}
                onClick={() => run(() => deleteGroup(itemId, g.id))}
                className="text-xs text-neutral-400 hover:text-red-700"
              >
                Remover grupo
              </button>
            </div>

            <ul className="mb-2 space-y-1">
              {g.modifiers.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {m.name}
                    {m.priceDeltaCents > 0 && (
                      <span className="text-neutral-500">
                        {" "}
                        +{formatMoney(m.priceDeltaCents)}
                      </span>
                    )}
                  </span>
                  <button
                    disabled={pending}
                    onClick={() => run(() => deleteModifier(itemId, m.id))}
                    className="text-xs text-neutral-400 hover:text-red-700"
                  >
                    Remover
                  </button>
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
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
              />
              <input
                name="price"
                placeholder="Extra € (opcional)"
                className="w-28 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
              />
              <button
                disabled={pending}
                className="rounded-lg border border-neutral-300 px-3 text-sm"
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
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            name="type"
            defaultValue="single"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="single">Escolha única (obrigatória)</option>
            <option value="multi">Múltipla (opcional)</option>
          </select>
          <button
            disabled={pending}
            className="rounded-lg bg-black px-4 text-sm text-white disabled:opacity-40"
          >
            Criar grupo
          </button>
        </form>
      </section>
    </main>
  );
}
