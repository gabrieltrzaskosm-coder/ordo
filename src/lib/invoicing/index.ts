// Emissão de fatura/recibo via fornecedor CERTIFICADO pela AT (Portugal).
// Não construímos software certificado: delegamos no fornecedor (Vendus), que
// emite o documento e trata do SAF-T.
//
// Regras:
//  - Cada restaurante emite com a SUA conta (establishment_invoicing). Sem
//    configuração => nada a fazer (nem todo o restaurante tem faturação ligada).
//  - Idempotente: no máximo UMA fatura emitida por pagamento (índice único
//    parcial em invoices). Chamável em segurança do webhook e do markPaid.
//  - A GORJETA não entra no documento fiscal — só os artigos (order_items).
//  - Best-effort: falhas ficam registadas (invoices.status='failed') para
//    reemitir; NUNCA devem reverter um pagamento real.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createVendusDocument, type VendusLine } from "./vendus";
import { isVatCode, type VatCode } from "./vat";

export type IssueOutcome =
  | { ok: true; number: string; pdfUrl?: string }
  | {
      ok: false;
      skipped:
        | "not_configured" // sem linha: o restaurante ainda não decidiu
        | "external" // fatura por fora de propósito — a app não emite
        | "already_issued"
        | "no_lines";
    }
  | { ok: false; error: string };

function asVatCode(v: string | null | undefined): VatCode {
  return isVatCode(v) ? v : "NOR";
}

/**
 * Emite (ou reemite) a fatura-recibo de um pagamento já pago. Silenciosa e
 * idempotente: pode ser chamada mais que uma vez para o mesmo pagamento.
 */
export async function issueInvoiceForPayment(
  paymentId: string,
): Promise<IssueOutcome> {
  const admin = createAdminClient();

  // Já existe fatura emitida? (idempotência lógica, além do índice único)
  const { data: existing } = await admin
    .from("invoices")
    .select("id, number, pdf_url")
    .eq("payment_id", paymentId)
    .eq("status", "issued")
    .maybeSingle();
  if (existing) {
    return { ok: false, skipped: "already_issued" };
  }

  const { data: payment } = await admin
    .from("payments")
    .select("id, establishment_id, order_id, status")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment || payment.status !== "paid") {
    return { ok: false, skipped: "not_configured" };
  }

  // Configuração de faturação do restaurante (tabela só acessível ao servidor).
  const { data: config } = await admin
    .from("establishment_invoicing")
    .select("provider, api_key, register_id, mode")
    .eq("establishment_id", payment.establishment_id)
    .maybeSingle();
  if (!config) {
    // Ainda não decidiu como fatura — não emitimos nada.
    return { ok: false, skipped: "not_configured" };
  }
  if (config.provider === "external") {
    // Fatura por fora de propósito (POS próprio, contabilista, outro software).
    return { ok: false, skipped: "external" };
  }
  // Fase 2: 'moloni' / 'invoicexpress'. Por agora só o Vendus emite.
  if (config.provider !== "vendus" || !config.api_key) {
    return { ok: false, skipped: "not_configured" };
  }

  // Linhas do documento a partir dos artigos do pedido. O IVA vem do menu_item
  // (código fiscal); se o item já não existir, cai em NOR (23%).
  const { data: items } = await admin
    .from("order_items")
    .select("name_snapshot, qty, unit_price_cents, menu_items(vat_code)")
    .eq("order_id", payment.order_id);

  const lines: VendusLine[] = (items ?? []).map((it) => {
    const mi = it.menu_items as unknown as { vat_code: string } | null;
    return {
      title: it.name_snapshot,
      qty: it.qty,
      grossUnitCents: it.unit_price_cents,
      taxId: asVatCode(mi?.vat_code),
    };
  });
  if (lines.length === 0) {
    return { ok: false, skipped: "no_lines" };
  }

  const amountCents = lines.reduce(
    (s, l) => s + l.grossUnitCents * l.qty,
    0,
  );

  try {
    const doc = await createVendusDocument({
      apiKey: config.api_key,
      registerId: config.register_id ?? undefined,
      mode: config.mode === "normal" ? "normal" : "tests",
      type: "FR",
      lines,
    });

    const { error: insErr } = await admin.from("invoices").insert({
      establishment_id: payment.establishment_id,
      payment_id: payment.id,
      provider: "vendus",
      status: "issued",
      at_document_ref: doc.id,
      number: doc.number,
      pdf_url: doc.pdfUrl ?? null,
      amount_cents: amountCents,
    });
    // Corrida: se outra emissão ganhou (índice único), tratamos como já emitida.
    if (insErr) return { ok: false, skipped: "already_issued" };

    return { ok: true, number: doc.number, pdfUrl: doc.pdfUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    // Regista a falha para diagnóstico/reemissão (não bloqueia o índice único
    // de emitidas, porque status='failed').
    await admin.from("invoices").insert({
      establishment_id: payment.establishment_id,
      payment_id: payment.id,
      provider: "vendus",
      status: "failed",
      amount_cents: amountCents,
      error: message.slice(0, 500),
    });
    return { ok: false, error: message };
  }
}
