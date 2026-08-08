import { requireManager } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Placeholder: a integração de pagamento (gateway) será ligada mais à frente.
// Por agora os pedidos são cobrados manualmente na mesa (ver Cozinha/Atendimento).
export default async function PagamentosPage() {
  await requireManager();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
        Pagamentos
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Como o restaurante recebe pelos pedidos.
      </p>

      <div className="mt-5 rounded-[22px] border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-weak px-3 py-1 text-xs font-bold text-brand-strong">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Em breve
        </span>
        <p className="mt-3 text-[17px] font-bold text-ink">
          Pagamento na mesa, por agora
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Os pedidos são cobrados na mesa pelo atendente. A integração de
          pagamento online — Pix, cartão e Apple Pay — será ligada em breve, e
          o dinheiro cairá direto na conta do restaurante, sem comissão.
        </p>
      </div>
    </div>
  );
}
