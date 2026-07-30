"use client";

// Boundary do ecrã do cliente. Um erro aqui apanha alguém sentado à mesa, com o
// telemóvel na mão — por isso não se fala em "voltar ao início" (levaria à
// página institucional, inútil para quem está a comer) nem se mostram detalhes
// técnicos. Só duas saídas: tentar outra vez ou chamar quem trabalha lá.
import { useEffect } from "react";

export default function MesaError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[erro:mesa]", error.digest ?? "(sem digest)", error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-ink">
        O menu não carregou
      </h1>
      <p className="mt-2 text-sm text-muted">
        Foi um problema nosso, não seu. Tente outra vez — se continuar, chame o
        garçom e faça o pedido pelo balcão.
      </p>

      <button
        onClick={() => unstable_retry()}
        className="mt-6 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:opacity-90"
      >
        Tentar de novo
      </button>

      {error.digest && (
        <p className="mt-6 text-[11px] text-muted">Referência: {error.digest}</p>
      )}
    </main>
  );
}
