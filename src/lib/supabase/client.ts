// Cliente Supabase para o browser (componentes cliente). Usa a anon key +
// RLS. Só o staff autenticado terá acesso a dados via este cliente.
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
}
