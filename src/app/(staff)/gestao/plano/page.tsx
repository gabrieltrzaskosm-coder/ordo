import Link from "next/link";
import { requireManager } from "@/lib/auth";
import {
  PLAN_ORDER,
  PLAN_LABELS,
  PLAN_TAGLINE,
  PLAN_INCLUDES,
  planRank,
  type Plan,
} from "@/lib/plans";

export const dynamic = "force-dynamic";

function isPlan(v: string | undefined): v is Plan {
  return v === "basic" || v === "pro" || v === "max";
}

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ bloqueado?: string }>;
}) {
  const session = await requireManager();
  const { bloqueado } = await searchParams;
  const locked = isPlan(bloqueado) ? bloqueado : null;
  const current = session.plan;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Meu plano</h1>
        <Link href="/gestao" className="text-sm text-muted hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Plano atual: <strong className="text-ink">{PLAN_LABELS[current]}</strong>.
        Para mudar de plano, fale connosco.
      </p>

      {locked && (
        <div className="mt-5 rounded-2xl border border-brand/30 bg-brand-weak p-4">
          <p className="text-sm font-medium text-brand-strong">
            Esta funcionalidade está disponível no plano {PLAN_LABELS[locked]}.
          </p>
          <p className="mt-1 text-sm text-ink">
            Faça upgrade para desbloquear — veja abaixo o que inclui.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((plan) => {
          const isCurrent = plan === current;
          const included = planRank(current) >= planRank(plan);
          return (
            <div
              key={plan}
              className={`flex flex-col rounded-2xl border p-5 shadow-[var(--shadow-card)] ${
                isCurrent
                  ? "border-brand ring-1 ring-brand"
                  : "border-line bg-surface"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  {PLAN_LABELS[plan]}
                </h2>
                {isCurrent && (
                  <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-brand-ink">
                    Atual
                  </span>
                )}
              </div>
              <p className="mb-4 text-sm text-muted">{PLAN_TAGLINE[plan]}</p>
              <ul className="space-y-2">
                {PLAN_INCLUDES[plan].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckIcon
                      className={included ? "text-brand" : "text-muted/50"}
                    />
                    <span className={included ? "text-ink" : "text-muted"}>
                      {item}
                    </span>
                  </li>
                ))}
                {plan !== "basic" && (
                  <li className="pt-1 text-xs text-muted">
                    + tudo do plano anterior
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={`mt-0.5 shrink-0 ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
