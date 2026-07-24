"use client"; // Error boundaries têm de ser Client Components.

// Rede de segurança para erros de renderização em qualquer rota sem boundary
// próprio. Sem isto, um erro mostra o ecrã cru do Next — a um cliente à mesa ou
// ao dono no meio do serviço.
//
// NOTA desta versão do Next: a prop de retentativa é `unstable_retry`, não o
// `reset` das versões anteriores.
import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Vai para os logs do servidor (Vercel). O `digest` é o identificador que
    // permite cruzar este ecrã com a entrada do log.
    console.error("[erro]", error.digest ?? "(sem digest)", error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-ink">Algo correu mal</h1>
      <p className="mt-2 text-sm text-muted">
        Já registámos o problema. Tente novamente — se persistir, chame o
        atendente.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <button
          onClick={() => unstable_retry()}
          className="rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:opacity-90"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand/40"
        >
          Voltar ao início
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-[11px] text-muted">
          Referência: {error.digest}
        </p>
      )}
    </main>
  );
}
