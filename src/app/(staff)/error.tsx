"use client";

// Boundary do staff (gestão e cozinha). Aqui o utilizador é profissional e está
// provavelmente a meio do serviço: mostra-se a referência do erro bem visível
// (serve para nos dizer o que aconteceu) e caminhos rápidos de volta ao
// trabalho, em vez de o deixar preso num ecrã morto.
import { useEffect } from "react";
import Link from "next/link";

export default function StaffError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[erro:staff]", error.digest ?? "(sem digest)", error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-ink">Algo correu mal</h1>
      <p className="mt-2 text-sm text-muted">
        Esta página não conseguiu carregar. Os pedidos e pagamentos já
        registados não foram afetados.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <button
          onClick={() => unstable_retry()}
          className="rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:opacity-90"
        >
          Tentar de novo
        </button>
        <div className="flex gap-2">
          <Link
            href="/cozinha"
            className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand/40"
          >
            Cozinha
          </Link>
          <Link
            href="/gestao"
            className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand/40"
          >
            Gestão
          </Link>
        </div>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-muted">
          Referência para suporte: <span className="tnum">{error.digest}</span>
        </p>
      )}
    </main>
  );
}
