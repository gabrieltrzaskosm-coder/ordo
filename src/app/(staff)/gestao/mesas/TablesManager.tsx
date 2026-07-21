"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  createTable,
  deleteTable,
  regenerateToken,
  setTableActive,
} from "./actions";

export type ManagedTable = {
  id: string;
  label: string;
  active: boolean;
  url: string;
  qrDataUrl: string;
};

export function TablesManager({
  tables,
  appUrl,
}: {
  tables: ManagedTable[];
  appUrl: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Algo correu mal.");
    });
  }

  const isLocalhost = appUrl.includes("localhost");

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-medium">Mesas & QR codes</h1>
        <Link href="/gestao" className="text-sm text-muted hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Cada mesa tem um código único. Imprima e coloque na mesa.
      </p>

      {isLocalhost && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Os QR apontam para <code>{appUrl}</code>, que só funciona neste
          computador. Antes de imprimir, defina <code>NEXT_PUBLIC_APP_URL</code>{" "}
          com o endereço público.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}

      <form action={(fd) => run(() => createTable(fd))} className="mb-8 flex gap-2">
        <input
          name="label"
          required
          placeholder="Nova mesa (ex.: Mesa 3, Esplanada 1)"
          className="flex-1 rounded-lg border border-line px-3 py-2"
        />
        <button
          disabled={pending}
          className="rounded-lg bg-brand px-4 text-sm text-brand-ink disabled:opacity-40"
        >
          Criar mesa
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {tables.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border p-4 ${
              t.active ? "border-line" : "border-line bg-neutral-50"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">{t.label}</p>
              {!t.active && (
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                  inativa
                </span>
              )}
            </div>

            <Image
              src={t.qrDataUrl}
              alt={`QR code da ${t.label}`}
              width={160}
              height={160}
              unoptimized
              className="mb-3 rounded bg-white"
            />

            <p className="mb-3 truncate text-xs text-muted" title={t.url}>
              {t.url}
            </p>

            <div className="flex flex-wrap gap-2">
              <a
                href={t.qrDataUrl}
                download={`qr-${t.label.replace(/\s+/g, "-").toLowerCase()}.png`}
                className="rounded-lg border border-line px-3 py-1 text-xs"
              >
                Descarregar
              </a>
              <button
                disabled={pending}
                onClick={() => run(() => setTableActive(t.id, !t.active))}
                className="rounded-lg border border-line px-3 py-1 text-xs"
              >
                {t.active ? "Desativar" : "Ativar"}
              </button>
              <button
                disabled={pending}
                onClick={() => run(() => regenerateToken(t.id))}
                className="rounded-lg border border-line px-3 py-1 text-xs"
                title="Invalida o QR antigo — é preciso reimprimir"
              >
                Novo código
              </button>
              <button
                disabled={pending}
                onClick={() => run(() => deleteTable(t.id))}
                className="px-2 text-xs text-muted hover:text-red-700"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <p className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-muted">
          Ainda não há mesas. Crie a primeira acima.
        </p>
      )}
    </main>
  );
}
