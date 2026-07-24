"use client";

// Último recurso: erro no próprio layout raiz, onde o error.tsx normal já não
// chega. Substitui o layout, por isso tem de trazer <html> e <body> próprios —
// e não pode depender de nada dele (fontes, providers). Estilos inline de
// propósito: se o CSS falhar, este ecrã ainda tem de ser legível.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="pt">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbf9f7",
          color: "#1c1917",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            Algo correu mal
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              color: "#78716c",
            }}
          >
            A aplicação não conseguiu carregar. Tente novamente.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              marginTop: "1.5rem",
              border: "none",
              borderRadius: "999px",
              background: "#9a3f22",
              color: "#fff",
              padding: "0.65rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.6875rem",
                color: "#a8a29e",
              }}
            >
              Referência: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
