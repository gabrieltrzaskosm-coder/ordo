// Monitorização de erros no CLIENTE (browser) via Sentry. O Next carrega este
// ficheiro automaticamente. Ativa-se só quando NEXT_PUBLIC_SENTRY_DSN está
// definida NO BUILD — nesse caso importa o SDK dinamicamente e inicializa (o
// Sentry instala sozinho os handlers globais). Sem DSN, a condição é falsa em
// tempo de build e o SDK é removido do bundle: zero peso no telemóvel do cliente.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      tracesSampleRate: 0,
      // Sem Session Replay (peso + privacidade dos comensais).
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    });
  });
}
