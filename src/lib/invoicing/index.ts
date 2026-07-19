// Emissão de fatura/recibo via fornecedor CERTIFICADO pela AT (Portugal).
// Não construímos software certificado: delegamos num fornecedor (Vendus/Moloni/
// InvoiceXpress) que emite o documento e trata do SAF-T. Skeleton — a integrar.
import "server-only";
import { serverEnv } from "@/lib/env";

export type IssueInvoiceInput = {
  paymentId: string;
  establishmentId: string;
  amountCents: number;
  currency: string;
  customerName?: string;
};

export type IssueInvoiceResult = {
  provider: string;
  atDocumentRef: string;
  pdfUrl?: string;
};

export async function issueCertifiedInvoice(
  _input: IssueInvoiceInput,
): Promise<IssueInvoiceResult> {
  // TODO: chamar a API do fornecedor (serverEnv.invoicingProvider / INVOICING_API_KEY),
  // guardar em `invoices` e devolver a referência do documento AT.
  void serverEnv.invoicingProvider;
  throw new Error("issueCertifiedInvoice ainda não implementado.");
}
