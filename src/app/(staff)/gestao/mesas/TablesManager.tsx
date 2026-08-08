"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
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
  const [selectedId, setSelectedId] = useState<string | null>(
    tables[0]?.id ?? null,
  );
  const [showNew, setShowNew] = useState(false);

  const selected =
    tables.find((t) => t.id === selectedId) ?? tables[0] ?? null;
  const activeCount = tables.filter((t) => t.active).length;
  const isLocalhost = appUrl.includes("localhost");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Algo correu mal.");
    });
  }

  function printQR(t: ManagedTable) {
    const w = window.open("", "_blank", "width=420,height=560");
    if (!w) return;
    w.document.write(
      `<title>QR — ${t.label}</title><body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><img src="${t.qrDataUrl}" style="width:320px;height:320px"/><p style="font-weight:700;font-size:20px;margin-top:8px">${t.label}</p></body>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
        Mesas &amp; QR
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {tables.length} {tables.length === 1 ? "mesa" : "mesas"} · {activeCount}{" "}
        ativa{activeCount === 1 ? "" : "s"} no salão
      </p>

      {isLocalhost && (
        <p className="mt-4 rounded-2xl border border-warn/30 bg-warn-weak p-3 text-sm text-warn">
          Os QR apontam para <code>{appUrl}</code>, que só funciona neste
          computador. Antes de imprimir, defina{" "}
          <code>NEXT_PUBLIC_APP_URL</code> com o endereço público.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-2xl border border-brand/30 bg-brand-weak p-3 text-sm text-brand-strong">
          {error}
        </p>
      )}

      {/* Salão — grelha de mesas */}
      <section className="mt-5 rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[15px] font-bold text-ink">Salão principal</div>
          <button
            onClick={() => setShowNew((s) => !s)}
            className="rounded-full bg-brand px-3.5 py-2 text-[13px] font-semibold text-brand-ink transition active:scale-95"
          >
            {showNew ? "Fechar" : "+ Nova mesa"}
          </button>
        </div>

        {showNew && (
          <form
            action={(fd) =>
              run(async () => {
                const res = await createTable(fd);
                if (res.ok) setShowNew(false);
                return res;
              })
            }
            className="mb-4 flex gap-2"
          >
            <input
              name="label"
              required
              autoFocus
              placeholder="Ex.: Mesa 3, Esplanada 1"
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

        {tables.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
            Ainda não há mesas. Crie a primeira com “+ Nova mesa”.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2.5">
            {tables.map((t) => {
              const on = selected?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center transition ${
                    on
                      ? "border-brand ring-1 ring-brand"
                      : "border-line hover:border-brand/40"
                  } ${t.active ? "" : "opacity-55"}`}
                  style={{ background: "rgba(212,29,13,.04)" }}
                >
                  <span className="line-clamp-2 text-[13px] font-extrabold leading-tight text-ink">
                    {t.label}
                  </span>
                  <span className="text-[10px] font-medium text-muted">
                    {t.active ? "ativa" : "inativa"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Detalhe do QR da mesa selecionada */}
      {selected && (
        <section className="mt-4 flex flex-col gap-5 rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
          <div className="shrink-0 self-center rounded-2xl border border-line bg-white p-2">
            <Image
              src={selected.qrDataUrl}
              alt={`QR code da ${selected.label}`}
              width={132}
              height={132}
              unoptimized
              className="rounded-lg"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-ink">
                {selected.label}
              </h3>
              {!selected.active && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                  inativa
                </span>
              )}
            </div>
            <p
              className="mt-1 truncate text-[13px] text-muted"
              title={selected.url}
            >
              {selected.url}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-muted">
              Código único que abre o cardápio e o pedido nesta mesa.
            </p>

            <div className="mt-3.5 flex flex-wrap gap-2">
              <button
                onClick={() => printQR(selected)}
                className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-canvas transition active:scale-95"
                style={{ background: "#191919", color: "#fff" }}
              >
                Imprimir QR
              </button>
              <a
                href={selected.qrDataUrl}
                download={`qr-${selected.label.replace(/\s+/g, "-").toLowerCase()}.png`}
                className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-ink transition hover:border-brand/40"
              >
                Baixar PNG
              </a>
              <button
                disabled={pending}
                onClick={() => run(() => setTableActive(selected.id, !selected.active))}
                className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink transition hover:border-brand/40 disabled:opacity-40"
              >
                {selected.active ? "Desativar" : "Ativar"}
              </button>
              <button
                disabled={pending}
                onClick={() => run(() => regenerateToken(selected.id))}
                title="Invalida o QR antigo — é preciso reimprimir"
                className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink transition hover:border-brand/40 disabled:opacity-40"
              >
                Novo código
              </button>
              <button
                disabled={pending}
                onClick={() => run(() => deleteTable(selected.id))}
                className="rounded-full px-3 py-2 text-[13px] font-medium text-muted transition hover:text-brand disabled:opacity-40"
              >
                Remover
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
