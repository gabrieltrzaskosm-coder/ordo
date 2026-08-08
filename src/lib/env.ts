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
  // Chave da plataforma (não por restaurante): a IA do plano Max é um custo da
  // plataforma. Ausente => a feature de resumo mostra "não configurado".
  anthropicApiKey: () => process.env.ANTHROPIC_API_KEY,
};
