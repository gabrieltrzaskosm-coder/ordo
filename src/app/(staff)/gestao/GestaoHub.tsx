"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  hasFeature,
  PLAN_LABELS,
  FEATURE_MIN_PLAN,
  type Feature,
  type Plan,
} from "@/lib/plans";

export type HubStat = { label: string; value: string; accent?: boolean };

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
}: {
  establishmentName: string;
  plan: Plan;
  stats: HubStat[];
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Hover "mágico" do bento: brilho que segue o cursor + tilt 3D por cartão.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = () => Array.from(grid.querySelectorAll<HTMLElement>("[data-bento]"));
    const move = (e: PointerEvent) => {
      const r = grid.getBoundingClientRect();
      grid.style.setProperty("--mx", e.clientX - r.left + "px");
      grid.style.setProperty("--my", e.clientY - r.top + "px");
      cards().forEach((card) => {
        const cr = card.getBoundingClientRect();
        const cx = e.clientX - cr.left;
        const cy = e.clientY - cr.top;
        const inside = cx >= 0 && cy >= 0 && cx <= cr.width && cy <= cr.height;
        const glow = card.querySelector<HTMLElement>("[data-glow]");
        if (inside) {
          const rx = (cy / cr.height - 0.5) * -7;
          const ry = (cx / cr.width - 0.5) * 7;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
          card.style.boxShadow = "0 22px 40px -22px rgba(212,29,13,.5)";
          card.style.borderColor = "rgba(212,29,13,.35)";
          if (glow) {
            glow.style.background = `radial-gradient(180px circle at ${cx}px ${cy}px, rgba(212,29,13,.13), transparent 65%)`;
            glow.style.opacity = "1";
          }
        } else {
          card.style.transform = "";
          card.style.boxShadow = "";
          card.style.borderColor = "";
          if (glow) glow.style.opacity = "0";
        }
      });
    };
    const leave = () => {
      grid.style.setProperty("--mx", "-999px");
      grid.style.setProperty("--my", "-999px");
      cards().forEach((card) => {
        card.style.transform = "";
        card.style.boxShadow = "";
        card.style.borderColor = "";
        const g = card.querySelector<HTMLElement>("[data-glow]");
        if (g) g.style.opacity = "0";
      });
    };
    grid.addEventListener("pointermove", move);
    grid.addEventListener("pointerleave", leave);
    return () => {
      grid.removeEventListener("pointermove", move);
      grid.removeEventListener("pointerleave", leave);
    };
  }, []);

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

      <div className="gh-grid" ref={gridRef} style={{ marginTop: 16 }}>
        <div className="gh-spot" aria-hidden />
        {CARDS.map((c) => {
          const locked = c.feature ? !hasFeature(plan, c.feature) : false;
          const href = locked ? "/gestao/plano" : c.route;
          return (
            <Link
              key={c.route}
              href={href}
              data-bento
              className={
                "gh-card" +
                (c.wide ? " is-wide" : "") +
                (locked ? " is-locked" : "")
              }
            >
              <div className="gh-glow" data-glow aria-hidden />
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
