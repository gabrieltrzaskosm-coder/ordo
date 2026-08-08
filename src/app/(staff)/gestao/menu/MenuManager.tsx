"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  setItemAvailability,
  updateItemPrice,
} from "./actions";

export type ManagedItem = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  available: boolean;
};

export type ManagedCategory = {
  id: string;
  name: string;
  items: ManagedItem[];
};

const THUMB =
  "repeating-linear-gradient(45deg,#f2eceb,#f2eceb 6px,#efe6e5 6px,#efe6e5 12px)";

export function MenuManager({ categories }: { categories: ManagedCategory[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(
    categories[0]?.id ?? null,
  );
  const [showNewCat, setShowNewCat] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);

  const cat = categories.find((c) => c.id === selectedCat) ?? categories[0] ?? null;
  const itemCount = categories.reduce((s, c) => s + c.items.length, 0);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Algo correu mal.");
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
        Cardápio
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {categories.length}{" "}
        {categories.length === 1 ? "categoria" : "categorias"} · {itemCount}{" "}
        {itemCount === 1 ? "prato" : "pratos"} · alterações aparecem já no
        cardápio dos clientes
      </p>

      {error && (
        <p className="mt-4 rounded-2xl border border-brand/30 bg-brand-weak p-3 text-sm text-brand-strong">
          {error}
        </p>
      )}

      {/* Pills de categoria */}
      <div className="mt-5 flex flex-wrap gap-2">
        {categories.map((c) => {
          const on = cat?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                on
                  ? "bg-brand text-brand-ink"
                  : "border border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              {c.name}
            </button>
          );
        })}
        <button
          onClick={() => setShowNewCat((s) => !s)}
          className="rounded-full border border-dashed border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-muted transition hover:text-ink"
        >
          {showNewCat ? "Fechar" : "+ Nova"}
        </button>
      </div>

      {showNewCat && (
        <form
          action={(fd) =>
            run(async () => {
              const res = await createCategory(fd);
              if (res.ok) setShowNewCat(false);
              return res;
            })
          }
          className="mt-3 flex gap-2"
        >
          <input
            name="name"
            required
            autoFocus
            placeholder="Nova categoria (ex.: Sobremesas)"
            className="flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted"
          />
          <button
            disabled={pending}
            className="rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink disabled:opacity-40"
          >
            Criar
          </button>
        </form>
      )}

      {!cat ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Ainda não há categorias. Crie a primeira com “+ Nova”.
        </p>
      ) : (
        <>
          <div className="mb-3 mt-6 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink">{cat.name}</h2>
            <button
              disabled={pending}
              onClick={() => run(() => deleteCategory(cat.id))}
              className="text-xs font-medium text-muted transition hover:text-brand"
            >
              Remover categoria
            </button>
          </div>

          <div className="space-y-2.5">
            {cat.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 rounded-[20px] border border-line bg-surface p-3.5 shadow-[var(--shadow-card)]"
              >
                <Link
                  href={`/gestao/menu/${item.id}`}
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-[14px] font-mono text-[9px] text-muted"
                  style={{ background: THUMB }}
                  aria-label={`Editar ${item.name}`}
                >
                  foto
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/gestao/menu/${item.id}`}
                        className={`block truncate text-[15px] font-bold text-ink hover:text-brand ${
                          item.available ? "" : "text-muted line-through"
                        }`}
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 truncate text-[12.5px] text-muted">
                        {item.description ? item.description : "Imagem e opções"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {editing === item.id ? (
                        <form
                          action={(fd) => {
                            const price = String(fd.get("price") ?? "");
                            run(async () => {
                              const res = await updateItemPrice(item.id, price);
                              if (res.ok) setEditing(null);
                              return res;
                            });
                          }}
                          className="flex items-center gap-1"
                        >
                          <input
                            name="price"
                            autoFocus
                            defaultValue={(item.priceCents / 100).toFixed(2)}
                            className="tnum w-20 rounded-lg border border-line px-2 py-1 text-sm"
                          />
                          <button
                            disabled={pending}
                            className="rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-brand-ink"
                          >
                            OK
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setEditing(item.id)}
                          className="tnum text-[16px] font-extrabold text-ink"
                          title="Editar preço"
                        >
                          {formatMoney(item.priceCents)}
                        </button>
                      )}
                      <div className="text-[11px] text-muted">preço base</div>
                    </div>
                  </div>

                  {/* Controlos rápidos */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      disabled={pending}
                      onClick={() =>
                        run(() => setItemAvailability(item.id, !item.available))
                      }
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                        item.available
                          ? "border-success/40 text-success"
                          : "border-line text-muted"
                      }`}
                    >
                      {item.available ? "Disponível" : "Esgotado"}
                    </button>
                    <Link
                      href={`/gestao/menu/${item.id}`}
                      className="text-[11px] font-semibold text-brand hover:underline"
                    >
                      Imagem e opções →
                    </Link>
                    <button
                      disabled={pending}
                      onClick={() => run(() => deleteItem(item.id))}
                      className="ml-auto text-[11px] font-medium text-muted transition hover:text-brand"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {cat.items.length === 0 && (
              <p className="rounded-[20px] border border-dashed border-line p-6 text-center text-sm text-muted">
                Sem pratos nesta categoria.
              </p>
            )}
          </div>

          {/* Adicionar prato */}
          {showNewItem ? (
            <form
              action={(fd) =>
                run(async () => {
                  const res = await createItem(fd);
                  if (res.ok) setShowNewItem(false);
                  return res;
                })
              }
              className="mt-3 flex flex-wrap gap-2 rounded-[20px] border border-line bg-surface p-3.5"
            >
              <input type="hidden" name="categoryId" value={cat.id} />
              <input
                name="name"
                required
                autoFocus
                placeholder="Prato"
                className="min-w-[8rem] flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted"
              />
              <input
                name="description"
                placeholder="Descrição (opcional)"
                className="min-w-[8rem] flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted"
              />
              <input
                name="price"
                required
                placeholder="8,50"
                className="tnum w-24 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted"
              />
              <button
                disabled={pending}
                className="rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink disabled:opacity-40"
              >
                Adicionar
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowNewItem(true)}
              className="mt-3 w-full rounded-[18px] border border-dashed border-line py-3.5 text-sm font-semibold text-muted transition hover:bg-surface hover:text-ink"
            >
              + Adicionar prato
            </button>
          )}
        </>
      )}
    </div>
  );
}
