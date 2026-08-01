"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { VAT_CODES, VAT_LABELS, type VatCode } from "@/lib/invoicing/vat";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  setItemAvailability,
  setItemVatCode,
  updateItemPrice,
} from "./actions";

export type ManagedItem = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  available: boolean;
  vatCode: VatCode;
};

export type ManagedCategory = {
  id: string;
  name: string;
  items: ManagedItem[];
};

export function MenuManager({ categories }: { categories: ManagedCategory[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Algo correu mal.");
    });
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-medium">Menu</h1>
        <Link href="/gestao" className="text-sm text-muted hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Alterações aparecem de imediato no cardápio dos clientes.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}

      <form
        action={(fd) => run(() => createCategory(fd))}
        className="mb-8 flex gap-2"
      >
        <input
          name="name"
          required
          placeholder="Nova categoria (ex.: Sobremesas)"
          className="flex-1 rounded-lg border border-line px-3 py-2"
        />
        <button
          disabled={pending}
          className="rounded-lg bg-brand px-4 text-sm text-brand-ink disabled:opacity-40"
        >
          Adicionar
        </button>
      </form>

      {categories.length === 0 && (
        <p className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-muted">
          Ainda não há categorias. Crie a primeira acima.
        </p>
      )}

      {categories.map((cat) => (
        <section key={cat.id} className="mb-8">
          <div className="mb-2 flex items-center justify-between border-b border-line pb-1">
            <h2 className="font-medium">{cat.name}</h2>
            <button
              disabled={pending}
              onClick={() => run(() => deleteCategory(cat.id))}
              className="text-xs text-muted hover:text-red-700"
            >
              Remover categoria
            </button>
          </div>

          <ul className="mb-3 space-y-2">
            {cat.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line p-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/gestao/menu/${item.id}`}
                    className={`hover:underline ${item.available ? "font-medium" : "font-medium text-muted line-through"}`}
                  >
                    {item.name}
                  </Link>
                  {item.description && (
                    <p className="truncate text-sm text-muted">
                      {item.description}
                    </p>
                  )}
                  <Link
                    href={`/gestao/menu/${item.id}`}
                    className="text-xs text-muted hover:underline"
                  >
                    Imagem e opções →
                  </Link>
                </div>

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
                      className="w-20 rounded border border-line px-2 py-1 text-sm"
                    />
                    <button
                      disabled={pending}
                      className="rounded bg-brand px-2 py-1 text-xs text-brand-ink"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="px-1 text-xs text-muted"
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setEditing(item.id)}
                    className="rounded px-2 py-1 text-sm hover:bg-surface-2"
                    title="Editar preço"
                  >
                    {formatMoney(item.priceCents)}
                  </button>
                )}

                <select
                  disabled={pending}
                  value={item.vatCode}
                  onChange={(e) => run(() => setItemVatCode(item.id, e.target.value))}
                  title="Taxa de imposto na nota fiscal"
                  className="rounded-lg border border-line px-1 py-1 text-xs"
                >
                  {VAT_CODES.map((c) => (
                    <option key={c} value={c}>
                      {VAT_LABELS[c]}
                    </option>
                  ))}
                </select>

                <button
                  disabled={pending}
                  onClick={() => run(() => setItemAvailability(item.id, !item.available))}
                  className={`rounded-lg border px-2 py-1 text-xs ${
                    item.available
                      ? "border-green-300 text-green-800"
                      : "border-line text-muted"
                  }`}
                >
                  {item.available ? "Disponível" : "Esgotado"}
                </button>

                <button
                  disabled={pending}
                  onClick={() => run(() => deleteItem(item.id))}
                  className="text-xs text-muted hover:text-red-700"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>

          <form
            action={(fd) => run(() => createItem(fd))}
            className="flex flex-wrap gap-2"
          >
            <input type="hidden" name="categoryId" value={cat.id} />
            <input
              name="name"
              required
              placeholder="Prato"
              className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
            />
            <input
              name="description"
              placeholder="Descrição (opcional)"
              className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
            />
            <input
              name="price"
              required
              placeholder="8,50"
              className="w-24 rounded-lg border border-line px-3 py-2 text-sm"
            />
            <select
              name="vatCode"
              defaultValue="NOR"
              title="Taxa de IVA na fatura"
              className="rounded-lg border border-line px-2 py-2 text-sm"
            >
              {VAT_CODES.map((c) => (
                <option key={c} value={c}>
                  {VAT_LABELS[c]}
                </option>
              ))}
            </select>
            <button
              disabled={pending}
              className="rounded-lg border border-line px-4 text-sm"
            >
              Adicionar prato
            </button>
          </form>
        </section>
      ))}
    </main>
  );
}
