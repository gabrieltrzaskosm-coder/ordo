"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  saveInvoicingConfig,
  setExternalInvoicing,
  removeInvoicingConfig,
  type InvoicingStatus,
} from "./actions";

export function FaturacaoManager({ status }: { status: InvoicingStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  // Mostra o formulário do Vendus quando se escolhe ligá-lo a partir de outro estado.
  const [showVendusForm, setShowVendusForm] = useState(false);

  function act(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) {
    setError(null);
    setOk(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        if (okMsg) setOk(okMsg);
        setShowVendusForm(false);
      } else {
        setError(res.error ?? "Algo correu mal.");
      }
    });
  }

  const isVendus = status.provider === "vendus";
  const isExternal = status.provider === "external";
  const undecided = status.provider === null;

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-medium">Faturação</h1>
        <Link href="/gestao" className="text-sm text-neutral-500 hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        Escolha como o restaurante emite a fatura-recibo certificada (AT) após
        cada pagamento.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}
      {ok && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-900">{ok}</p>
      )}

      {/* ---------- Estado atual ---------- */}
      {isVendus && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-900">
            A emitir automaticamente via Vendus
          </p>
          <p className="mt-1 text-green-800">
            Modo:{" "}
            <strong>{status.mode === "tests" ? "Testes" : "Produção"}</strong>
            {status.registerId && <> · Registo #{status.registerId}</>}
          </p>
        </div>
      )}

      {isExternal && (
        <div className="mb-6 rounded-lg border border-neutral-300 bg-neutral-50 p-4 text-sm">
          <p className="font-medium">Faturação tratada por fora</p>
          <p className="mt-1 text-neutral-600">
            A app <strong>não emite</strong> documentos fiscais. O restaurante
            fatura no seu próprio sistema (POS, contabilista ou outro software).
          </p>
        </div>
      )}

      {/* ---------- Escolha / mudança de opção ---------- */}
      {(undecided || showVendusForm) && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-neutral-500">
            {isVendus ? "Atualizar chave do Vendus" : "Emitir pela app (Vendus)"}
          </h2>
          <form
            action={(fd) =>
              act(
                () => saveInvoicingConfig(fd),
                "Configuração guardada e validada no Vendus.",
              )
            }
            className="space-y-3"
          >
            <input
              name="apiKey"
              type="password"
              autoComplete="off"
              required
              placeholder="API key do Vendus"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
            <select
              name="mode"
              defaultValue={status.mode}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              <option value="tests">Testes (documentos não fiscais)</option>
              <option value="normal">Produção (documentos reais)</option>
            </select>
            <button
              disabled={pending}
              className="w-full rounded-lg bg-black py-2 text-sm text-white disabled:opacity-40"
            >
              {pending ? "A validar…" : "Guardar e validar"}
            </button>
          </form>
          <p className="mt-2 text-xs text-neutral-400">
            A chave é guardada de forma segura no servidor e nunca é mostrada de
            volta. Obtenha-a no Vendus em Definições → Integrações → API.
          </p>
        </section>
      )}

      {/* ---------- Ações de mudança ---------- */}
      <div className="flex flex-wrap gap-3 text-sm">
        {/* Ligar Vendus (quando não está a mostrar o formulário e não é Vendus) */}
        {!isVendus && !showVendusForm && (
          <button
            onClick={() => setShowVendusForm(true)}
            className="rounded-lg border border-neutral-300 px-3 py-1.5"
          >
            Emitir pela app (Vendus)
          </button>
        )}
        {/* Trocar chave do Vendus */}
        {isVendus && !showVendusForm && (
          <button
            onClick={() => setShowVendusForm(true)}
            className="rounded-lg border border-neutral-300 px-3 py-1.5"
          >
            Atualizar chave
          </button>
        )}
        {/* Faturar por fora */}
        {!isExternal && (
          <button
            disabled={pending}
            onClick={() =>
              act(() => setExternalInvoicing(), "Faturação passa a ser tratada por fora.")
            }
            className="rounded-lg border border-neutral-300 px-3 py-1.5"
          >
            Faturo por fora (a app não emite)
          </button>
        )}
        {/* Repor / limpar decisão */}
        {!undecided && (
          <button
            disabled={pending}
            onClick={() => act(() => removeInvoicingConfig())}
            className="rounded-lg px-3 py-1.5 text-neutral-500 hover:text-red-700"
          >
            Limpar
          </button>
        )}
        {showVendusForm && !undecided && (
          <button
            onClick={() => setShowVendusForm(false)}
            className="rounded-lg px-3 py-1.5 text-neutral-500"
          >
            Cancelar
          </button>
        )}
      </div>
    </main>
  );
}
