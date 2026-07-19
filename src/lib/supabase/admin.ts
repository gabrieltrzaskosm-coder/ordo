// Cliente Supabase com service role — IGNORA RLS.
// USAR APENAS em código de servidor e SEMPRE filtrando explicitamente por
// establishment_id / mesa resolvidos. É o caminho das operações do cliente
// anónimo (validadas por qr_token). Nunca importar em código do browser.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "./database.types";

export function createAdminClient() {
  return createClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
