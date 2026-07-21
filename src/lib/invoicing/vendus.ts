// Adaptador do Vendus (fornecedor certificado AT). Emite um documento fiscal
// via API REST. Doc: https://www.vendus.pt/ws/v1.1/documents.doc
//
// Autenticação: HTTP Basic com a API key como username e password vazia.
// O IVA vai por CÓDIGO (tax_id): NOR/INT/RED/ISE — o Vendus resolve a taxa pela
// região fiscal da conta. Preço por linha em `gross_price` (unitário COM IVA).
import "server-only";
import type { VatCode } from "./vat";

const VENDUS_BASE = "https://www.vendus.pt/ws/v1.1";

export type { VatCode };

export type VendusLine = {
  title: string;
  qty: number;
  grossUnitCents: number; // preço unitário COM IVA, em cêntimos
  taxId: VatCode;
};

export type VendusClient = {
  name?: string;
  fiscalId?: string; // NIF; ausente => consumidor final
};

export type CreateDocumentInput = {
  apiKey: string;
  registerId?: string; // POS; se ausente, o Vendus usa o registo por defeito
  mode: "tests" | "normal";
  type?: "FR" | "FT" | "FS"; // default FR (fatura-recibo)
  client?: VendusClient;
  lines: VendusLine[];
};

export type CreateDocumentResult = {
  id: string;
  number: string;
  pdfUrl?: string;
};

function authHeader(apiKey: string): string {
  // Basic base64("apiKey:") — password vazia.
  return "Basic " + Buffer.from(`${apiKey}:`).toString("base64");
}

/** Cria um documento no Vendus e devolve a referência AT + URL do PDF. */
export async function createVendusDocument(
  input: CreateDocumentInput,
): Promise<CreateDocumentResult> {
  const body: Record<string, unknown> = {
    type: input.type ?? "FR",
    mode: input.mode,
    items: input.lines.map((l) => ({
      title: l.title,
      qty: l.qty,
      gross_price: l.grossUnitCents / 100,
      tax_id: l.taxId,
    })),
  };
  if (input.registerId) body.register_id = input.registerId;
  if (input.client?.name || input.client?.fiscalId) {
    body.client = {
      ...(input.client.name ? { name: input.client.name } : {}),
      ...(input.client.fiscalId ? { fiscal_id: input.client.fiscalId } : {}),
    };
  }

  const res = await fetch(`${VENDUS_BASE}/documents/`, {
    method: "POST",
    headers: {
      Authorization: authHeader(input.apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    // O Vendus devolve { errors: [{ code, message }] } em JSON.
    let detail = text.slice(0, 300);
    try {
      const j = JSON.parse(text);
      const msg = j?.errors?.[0]?.message ?? j?.message;
      if (msg) detail = String(msg);
    } catch {
      // fica com o texto cru
    }
    throw new Error(`Vendus ${res.status}: ${detail}`);
  }

  const data = JSON.parse(text) as {
    id?: number | string;
    number?: string;
    output?: { pdf_url?: string };
    pdf_url?: string;
  };
  const id = data.id != null ? String(data.id) : "";
  return {
    id,
    number: data.number ?? "",
    pdfUrl: data.output?.pdf_url ?? data.pdf_url,
  };
}

/**
 * Valida a API key e devolve o id de um registo do tipo `api` (o Vendus só
 * emite via API por um registo desse tipo — um `pos` dá erro na emissão).
 * Serve de "test connection". Devolve null se a chave é válida mas não há
 * nenhum registo API criado (o chamador avisa o utilizador para o criar).
 */
export async function fetchApiRegisterId(
  apiKey: string,
): Promise<string | null> {
  const res = await fetch(`${VENDUS_BASE}/registers/`, {
    headers: { Authorization: authHeader(apiKey) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vendus ${res.status}: ${text.slice(0, 200)}`);
  }
  const list = (await res.json()) as Array<{
    id?: number | string;
    type?: string;
  }>;
  const apiReg = Array.isArray(list)
    ? list.find((r) => r.type === "api")
    : undefined;
  return apiReg?.id != null ? String(apiReg.id) : null;
}
