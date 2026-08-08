"use client";

import { useState, useTransition } from "react";
import { generateSummary } from "./actions";

export function AssistantClient() {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await generateSummary();
      if (res.ok) {
        setText(res.text);
      } else if (res.reason === "no_key") {
        setError(
          "Assistente de IA ainda não configurado nesta plataforma (falta a chave da API).",
        );
      } else {
        setError("Não foi possível gerar o resumo agora. Tente daqui a pouco.");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 rounded-[20px] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
        <div>
          <p className="font-bold text-ink">Resumo inteligente do dia</p>
          <p className="text-sm text-muted">
            Uma leitura do dia em linguagem natural, a partir dos seus números.
          </p>
        </div>
        <button
          onClick={run}
          disabled={pending}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink transition active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "A gerar…" : text ? "Gerar de novo" : "Gerar resumo"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-warn-weak px-3 py-2 text-sm text-warn">
          {error}
        </p>
      )}
      {text && (
        // Cartão gradiente (elemento-assinatura do design): o resumo da IA em
        // destaque, texto branco sobre o vermelho da marca Ordo.
        <div
          className="mt-4 rounded-[22px] p-6 text-white shadow-[0_18px_40px_-20px_rgba(212,29,13,.55)]"
          style={{ background: "linear-gradient(135deg, #d41d0d, #b01808)" }}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.05em] text-white/80">
            Resumo de performance
          </p>
          <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
