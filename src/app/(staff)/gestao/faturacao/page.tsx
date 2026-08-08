import { requireManager } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Placeholder: o sistema de faturação (nota fiscal) será ligado mais à frente.
export default async function FaturacaoPage() {
  await requireManager();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
        Faturamento
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Emissão de nota fiscal dos pedidos.
      </p>

      <div className="mt-5 rounded-[22px] border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-weak px-3 py-1 text-xs font-bold text-brand-strong">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Em breve
        </span>
        <p className="mt-3 text-[17px] font-bold text-ink">
          Sistema de faturação em configuração
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          A emissão automática de nota fiscal será ligada em breve. Por agora, o
          restaurante emite as notas pelo seu próprio sistema.
        </p>
      </div>
    </div>
  );
}
