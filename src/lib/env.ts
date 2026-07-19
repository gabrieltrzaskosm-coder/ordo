// Acesso centralizado e validado às variáveis de ambiente.
// Falha cedo (no arranque do servidor) se algo essencial faltar.

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Variável de ambiente em falta: ${name}`);
  return value;
}

// Getters lazy: o import deste módulo nunca falha. A validação só corre quando a
// variável é usada — assim o build (ex.: no Vercel, antes de as chaves estarem
// definidas) não rebenta ao avaliar o módulo.
export const publicEnv = {
  get supabaseUrl() {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseAnonKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
};

// Só deve ser lido em código de servidor. Nunca importar em componentes cliente.
export const serverEnv = {
  supabaseServiceRoleKey: () =>
    required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "stripe",
  stripeSecretKey: () => process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: () => process.env.STRIPE_WEBHOOK_SECRET,
  invoicingProvider: process.env.INVOICING_PROVIDER ?? "vendus",
  invoicingApiKey: () => process.env.INVOICING_API_KEY,
};
