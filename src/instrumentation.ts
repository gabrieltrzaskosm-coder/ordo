// Monitorização de erros de SERVIDOR (server components, route handlers, server
// actions) via Sentry. Ativa-se só quando SENTRY_DSN está definida — e nesse
// caso o SDK é importado DINAMICAMENTE, para que, sem DSN, o @sentry/nextjs (que
// arrasta o OpenTelemetry) nunca seja carregado nem pese no cold-start.
//
// De propósito SEM `withSentryConfig` (plugin de build): usamos só os ganchos
// nativos do Next (register + onRequestError). Fica-se sem upload automático de
// source maps, mas o build não é tocado e a captura de erros funciona.
import type { Instrumentation } from "next";

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  if (
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME === "edge"
  ) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      // Só erros: sem tracing de performance (custo e ruído desnecessários).
      tracesSampleRate: 0,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }
}

// O Next chama isto sempre que o servidor apanha um erro. Sem DSN, sai logo (o
// Sentry nem chega a ser importado).
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
};
