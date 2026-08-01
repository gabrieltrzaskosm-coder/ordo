import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import {
  hasFeature,
  PLAN_LABELS,
  FEATURE_MIN_PLAN,
  type Feature,
} from "@/lib/plans";

export const dynamic = "force-dynamic";

const NAV = [
  {
    href: "/gestao/menu",
    title: "Cardápio",
    desc: "Categorias, pratos, preços e impostos.",
    icon: "M4 5h16M4 12h16M4 19h10",
  },
  {
    href: "/gestao/mesas",
    title: "Mesas & QR codes",
    desc: "Criar mesas, gerar e imprimir códigos.",
    icon: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  },
  {
    href: "/gestao/equipa",
    title: "Equipe",
    desc: "Contas de cozinha, atendimento e gestão.",
    icon: "M17 20v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75",
  },
  {
    href: "/gestao/pagamentos",
    title: "Pagamentos",
    desc: "Ligar a conta Stripe para receber na mesa.",
    icon: "M2 7h20v12H2zM2 11h20M6 15h4",
  },
  {
    href: "/gestao/faturacao",
    title: "Faturamento",
    desc: "Configurar a emissão de nota fiscal dos pagamentos.",
    icon: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h4",
  },
];

// Funcionalidades sujeitas a plano. Enquanto não estiverem construídas, o link
// leva à página do plano (upsell). Quando forem feitas, passam a apontar para a
// própria feature (já protegida por requirePlan no servidor).
// `href` só quando a feature já existe; senão, o clique leva ao upsell. O gate
// real é o requirePlan no servidor da própria página.
const PLAN_FEATURES: {
  feature: Feature;
  title: string;
  desc: string;
  icon: string;
  href?: string;
}[] = [
  {
    feature: "financeiro",
    title: "Balanço financeiro",
    desc: "Resultados diários e mensais, com exportação.",
    icon: "M3 3v18h18M7 14l3-3 3 3 5-5",
    href: "/gestao/financeiro",
  },
  {
    feature: "insights",
    title: "Insights de negócio",
    desc: "Horas de pico, ticket médio e mais vendidos.",
    icon: "M8 18v-4M12 18v-8M16 18v-6M3 21h18",
    href: "/gestao/insights",
  },
  {
    feature: "stock",
    title: "Controle de estoque",
    desc: "Baixa automática e alertas de ruptura.",
    icon: "M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7",
    href: "/gestao/stock",
  },
  {
    feature: "ia",
    title: "Assistente IA",
    desc: "Resumo do dia, previsão e alertas inteligentes.",
    icon: "M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2M12 9a3 3 0 100 6 3 3 0 000-6z",
    href: "/gestao/ia",
  },
];

export default async function GestaoPage() {
  const session = await requireManager();
  const supabase = await createClient();

  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const { data: hoje } = await supabase
    .from("orders")
    .select("total_cents, status")
    .gte("created_at", inicioDoDia.toISOString());

  const validos = (hoje ?? []).filter((o) => o.status !== "cancelled");
  const totalCents = validos.reduce((s, o) => s + o.total_cents, 0);
  const ticketMedio = validos.length ? Math.round(totalCents / validos.length) : 0;

  const stats = [
    { label: "Pedidos hoje", value: String(validos.length) },
    { label: "Valor pedido", value: formatMoney(totalCents) },
    { label: "Ticket médio", value: formatMoney(ticketMedio) },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Gestão</h1>
          <p className="mt-1 text-sm text-muted">{session.establishmentName}</p>
        </div>
        <Link
          href="/gestao/plano"
          className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand/40"
        >
          Plano {PLAN_LABELS[session.plan]}
        </Link>
      </div>

      <section className="mt-6 grid grid-cols-3 divide-x divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        {stats.map((s) => (
          <div key={s.label} className="px-4 py-5">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="tnum mt-1 text-xl font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </section>
      <p className="mt-2 px-1 text-xs text-muted">
        Valor <strong className="font-medium text-ink">pedido</strong> do dia
        (todos os pedidos), não apenas o já cobrado.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition hover:border-brand/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-weak text-brand-strong">
              <Icon d={item.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{item.title}</p>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
            <Chevron />
          </Link>
        ))}
      </div>

      {/* ---------- Funcionalidades por plano ---------- */}
      <h2 className="mt-8 mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Mais funcionalidades
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {PLAN_FEATURES.map((f) => {
          const unlocked = hasFeature(session.plan, f.feature);
          // Se existe e está desbloqueada, vai à feature; senão ao upsell.
          const href = unlocked && f.href ? f.href : "/gestao/plano";
          const built = Boolean(f.href);
          return (
            <Link
              key={f.feature}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition hover:border-brand/40"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  unlocked
                    ? "bg-brand-weak text-brand-strong"
                    : "bg-surface-2 text-muted"
                }`}
              >
                <Icon d={f.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  {f.title}
                  <span className="rounded-full bg-brand-weak px-2 py-0.5 text-[11px] font-semibold text-brand-strong">
                    {PLAN_LABELS[FEATURE_MIN_PLAN[f.feature]]}
                  </span>
                </p>
                <p className="text-sm text-muted">
                  {unlocked ? (built ? f.desc : "Em breve no seu plano.") : f.desc}
                </p>
              </div>
              {unlocked ? <Chevron /> : <LockIcon />}
            </Link>
          );
        })}
      </div>
    </main>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron() {
  return (
    <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-brand">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function LockIcon() {
  return (
    <span className="text-muted">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}
