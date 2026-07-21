"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  saveInvoicingConfig,
  removeInvoicingConfig,
  type InvoicingStatus,
} from "./actions";

export function FaturacaoManager({ status }: { status: InvoicingStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function save(formData: FormData) {
    setError(null);
    setOk(null);
    startTransition(async () => {
      const res = await saveInvoicingConfig(formData);
      if (res.ok) setOk("Configuração guardada e validada no Vendus.");
      else setError(res.error ?? "Algo correu mal.");
    });
  }

  function remove() {
    setError(null);
    setOk(null);
    startTransition(async () => {
      const res = await removeInvoicingConfig();
      if (!res.ok) setError(res.error ?? "Algo correu mal.");
    });
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-medium">Faturação</h1>
        <Link href="/gestao" className="text-sm text-neutral-500 hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        Ligue a sua conta <strong>Vendus</strong> para emitir automaticamente a
        fatura-recibo certificada (AT) após cada pagamento.
      </p>

      {status.configured && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-900">Faturação ativa</p>
          <p className="mt-1 text-green-800">
            Modo:{" "}
            <strong>{status.mode === "tests" ? "Testes" : "Produção"}</strong>
            {status.registerId && <> · Registo #{status.registerId}</>}
          </p>
          <button
            onClick={remove}
            disabled={pending}
            className="mt-3 text-xs text-neutral-500 hover:text-red-700"
          >
            Desligar faturação
          </button>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}
      {ok && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-900">{ok}</p>
      )}

      <h2 className="mb-3 text-sm font-medium text-neutral-500">
        {status.configured ? "Atualizar chave" : "Ligar o Vendus"}
      </h2>
      <form action={save} className="space-y-3">
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
    </main>
  );
}
