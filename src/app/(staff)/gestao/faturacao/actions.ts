"use server";

// Configuração da faturação (Vendus) do estabelecimento. A API key é um SEGREDO:
// entra por aqui (server action, admin client) mas NUNCA é devolvida ao browser.
// A gestão vê apenas o estado (configurado, modo, nº do registo).
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchDefaultRegisterId } from "@/lib/invoicing/vendus";

// null = ainda não decidiu; 'external' = fatura por fora (app não emite).
export type InvoicingProvider = "vendus" | "external" | null;

export type InvoicingStatus = {
  provider: InvoicingProvider;
  mode: "tests" | "normal";
  registerId: string | null;
};

export type SaveResult = { ok: boolean; error?: string };

const saveSchema = z.object({
  apiKey: z.string().trim().min(10, "Chave demasiado curta."),
  mode: z.enum(["tests", "normal"]),
});

/** Lê o estado (sem expor a chave). Usado pela página. */
export async function getInvoicingStatus(): Promise<InvoicingStatus> {
  const session = await requireManager();
  const admin = createAdminClient();
  const { data } = await admin
    .from("establishment_invoicing")
    .select("provider, mode, register_id")
    .eq("establishment_id", session.establishmentId)
    .maybeSingle();

  const provider =
    data?.provider === "vendus" || data?.provider === "external"
      ? data.provider
      : null;

  return {
    provider,
    mode: (data?.mode as "tests" | "normal") ?? "tests",
    registerId: data?.register_id ?? null,
  };
}

/** Declara que o restaurante fatura por fora: a app deixa de emitir. */
export async function setExternalInvoicing(): Promise<SaveResult> {
  const session = await requireManager();
  const admin = createAdminClient();
  const { error } = await admin.from("establishment_invoicing").upsert(
    {
      establishment_id: session.establishmentId,
      provider: "external",
      api_key: null,
      register_id: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "establishment_id" },
  );
  if (error) return { ok: false, error: "Falha ao guardar a opção." };

  revalidatePath("/gestao/faturacao");
  return { ok: true };
}

/**
 * Guarda a chave. Valida-a contra o Vendus (lista os registos) e guarda o
 * registo por defeito — se a chave for inválida, nem chega a persistir.
 */
export async function saveInvoicingConfig(
  formData: FormData,
): Promise<SaveResult> {
  const session = await requireManager();
  const parsed = saveSchema.safeParse({
    apiKey: formData.get("apiKey"),
    mode: formData.get("mode"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { apiKey, mode } = parsed.data;

  let registerId: string | null = null;
  try {
    registerId = await fetchDefaultRegisterId(apiKey);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return {
      ok: false,
      error: `Não foi possível validar a chave no Vendus. ${msg}`.trim(),
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("establishment_invoicing").upsert(
    {
      establishment_id: session.establishmentId,
      provider: "vendus",
      api_key: apiKey,
      register_id: registerId,
      mode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "establishment_id" },
  );
  if (error) return { ok: false, error: "Falha ao guardar a configuração." };

  revalidatePath("/gestao/faturacao");
  return { ok: true };
}

/** Desliga a faturação (apaga a chave). */
export async function removeInvoicingConfig(): Promise<SaveResult> {
  const session = await requireManager();
  const admin = createAdminClient();
  const { error } = await admin
    .from("establishment_invoicing")
    .delete()
    .eq("establishment_id", session.establishmentId);
  if (error) return { ok: false, error: "Falha ao remover a configuração." };

  revalidatePath("/gestao/faturacao");
  return { ok: true };
}
