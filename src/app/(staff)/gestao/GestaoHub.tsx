"use client";

import Link from "next/link";
import {
  hasFeature,
  PLAN_LABELS,
  FEATURE_MIN_PLAN,
  type Feature,
  type Plan,
} from "@/lib/plans";

export type HubStat = { label: string; value: string; accent?: boolean };
export type WeekdayAvg = { weekday: number; label: string; avg: number };

type Card = {
  route: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  feature?: Feature;
  wide?: boolean;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const CARDS: Card[] = [
  {
    route: "/gestao/menu",
    title: "Cardápio",
    desc: "Categorias, pratos, preços e extras",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    route: "/gestao/mesas",
    title: "Mesas & QR",
    desc: "Organize o salão e gere QR Codes",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    route: "/gestao/equipa",
    title: "Equipe",
    desc: "Acessos de cozinha, salão e gestão",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
        <path d="M16 5.2A3 3 0 0 1 16 11M18 19c0-2.4-1-4-2.6-4.6" />
      </svg>
    ),
  },
  {
    route: "/gestao/pagamentos",
    title: "Pagamentos",
    desc: "Recebimento na mesa e conexão",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    route: "/gestao/faturacao",
    title: "Faturamento",
    desc: "Emissão, histórico e download de notas fiscais",
    wide: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M13 3v5h5M10 13h5M10 17h5" />
      </svg>
    ),
  },
  {
    route: "/gestao/financeiro",
    title: "Financeiro",
    desc: "Balanço, tendências e export CSV",
    feature: "financeiro",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" />
      </svg>
    ),
  },
  {
    route: "/gestao/insights",
    title: "Insights",
    desc: "Horas de pico e ranking de itens",
    feature: "insights",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    ),
  },
  {
    route: "/gestao/stock",
    title: "Estoque",
    desc: "Insumos, alertas e limiares",
    feature: "stock",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <path d="M3 8l9-4 9 4-9 4z" />
        <path d="M3 8v8l9 4 9-4V8" />
      </svg>
    ),
  },
  {
    route: "/gestao/ia",
    title: "Ordo IA",
    desc: "Resumos, previsões e alertas",
    feature: "ia",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
        <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" />
        <path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z" />
      </svg>
    ),
  },
];

function Chevron() {
  return (
    <svg
      className="gh-chev"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function Lock({ label }: { label: string }) {
  return (
    <span className="gh-badge">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      {label}
    </span>
  );
}

export function GestaoHub({
  establishmentName,
  plan,
  stats,
  weekdays,
}: {
  establishmentName: string;
  plan: Plan;
  stats: HubStat[];
  weekdays: WeekdayAvg[];
}) {
  const maxAvg = Math.max(0, ...weekdays.map((w) => w.avg));
  const todayWeekday = new Date().getDay();
  const busiest = weekdays.reduce(
    (a, b) => (b.avg > a.avg ? b : a),
    weekdays[0] ?? { weekday: 0, label: "", avg: 0 },
  );

  return (
    <div className="gh-wrap">
      <div className="gh-head">
        <div>
          <h1 className="gh-title">Gestão</h1>
          <p className="gh-welcome">Bem-vindo de volta, {establishmentName}</p>
        </div>
        <span className="gh-plan">
          <span className="gh-plan-dot" />
          Plano {PLAN_LABELS[plan]}
        </span>
      </div>

      <div className="gh-metrics">
        {stats.map((s) => (
          <div key={s.label} className="gh-metric">
            <div className="gh-metric-label">{s.label}</div>
            <div className={"gh-metric-value" + (s.accent ? " is-accent" : "")}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <p className="gh-metric-note">
        Valor <strong>pedido</strong> do dia (todos os pedidos), não apenas o já
        cobrado.
      </p>

      {/* Movimento esperado por dia da semana — uma "base" para o restaurante */}
      <section
        className="rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow-card)]"
        style={{ marginTop: 16 }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-bold text-ink">Movimento esperado por dia</p>
          <p className="text-xs text-muted">média de pedidos · últimas 8 semanas</p>
        </div>

        {maxAvg === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Ainda sem histórico suficiente. Esta base aparece à medida que os
            pedidos vão entrando.
          </p>
        ) : (
          <>
            <div className="mt-4 flex items-end gap-2">
              {weekdays.map((w) => {
                const today = w.weekday === todayWeekday;
                return (
                  <div
                    key={w.weekday}
                    className="flex flex-1 flex-col items-center gap-2"
                    title={`${w.label}: ~${w.avg} pedidos`}
                  >
                    <span
                      className={
                        "tnum text-sm font-extrabold " +
                        (today ? "text-brand" : "text-ink")
                      }
                    >
                      {w.avg}
                    </span>
                    <div className="flex h-24 w-full flex-col justify-end">
                      <div
                        className="w-full rounded-t-lg"
                        style={{
                          height: `${(w.avg / maxAvg) * 100}%`,
                          minHeight: w.avg > 0 ? "4px" : "0",
                          background: today
                            ? "linear-gradient(180deg,#d41d0d,#f0787c)"
                            : "rgba(212,29,13,.18)",
                        }}
                      />
                    </div>
                    <span
                      className={
                        "text-[11px] font-semibold " +
                        (today ? "text-brand" : "text-muted")
                      }
                    >
                      {w.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted">
              Uma base do movimento: numa{" "}
              <strong className="font-semibold text-ink">{busiest.label}</strong>{" "}
              típica, espere ~{busiest.avg} pedidos. Hoje está destacado.
            </p>
          </>
        )}
      </section>

      <div className="gh-grid" style={{ marginTop: 16 }}>
        {CARDS.map((c) => {
          const locked = c.feature ? !hasFeature(plan, c.feature) : false;
          const href = locked ? "/gestao/plano" : c.route;
          return (
            <Link
              key={c.route}
              href={href}
              className={
                "gh-card" +
                (c.wide ? " is-wide" : "") +
                (locked ? " is-locked" : "")
              }
            >
              {c.wide ? (
                <div className="gh-wide-row">
                  <span className="gh-card-icon">{c.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="gh-card-title">{c.title}</div>
                    <div className="gh-card-desc">{c.desc}</div>
                  </div>
                  <Chevron />
                </div>
              ) : (
                <>
                  <div className="gh-card-top">
                    <span className="gh-card-icon">{c.icon}</span>
                    {locked && c.feature ? (
                      <Lock label={PLAN_LABELS[FEATURE_MIN_PLAN[c.feature]]} />
                    ) : (
                      <Chevron />
                    )}
                  </div>
                  <div className="gh-card-title">{c.title}</div>
                  <div className="gh-card-desc">{c.desc}</div>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
