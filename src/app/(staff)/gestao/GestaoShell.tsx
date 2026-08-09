"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { signOut } from "@/app/login/actions";
import { hasFeature, type Feature, type Plan } from "@/lib/plans";

// Chrome da área de gestão: sidebar fixa (navegação numerada com efeito de
// proximidade) + rodapé com atalhos operacionais e sair. Port do design do
// Claude Design, na paleta da marca Ordo (vermelho #d41d0d) e fonte Manrope.
// CSS escopado em `.gs-*`/`.gh-*` (o hub reutiliza `.gh-*`), sem tocar nos
// temas de cozinha/atendimento nem na landing.

type NavDef = { route: string; label: string; feature: Feature | null };

const NAV: NavDef[] = [
  { route: "/gestao", label: "Gestão", feature: null },
  { route: "/gestao/menu", label: "Cardápio", feature: null },
  { route: "/gestao/mesas", label: "Mesas", feature: null },
  { route: "/gestao/equipa", label: "Equipe", feature: null },
  { route: "/gestao/pagamentos", label: "Pagamentos", feature: null },
  { route: "/gestao/faturacao", label: "Faturamento", feature: null },
  { route: "/gestao/financeiro", label: "Financeiro", feature: "financeiro" },
  { route: "/gestao/insights", label: "Insights", feature: "insights" },
  { route: "/gestao/stock", label: "Estoque", feature: "stock" },
  { route: "/gestao/ia", label: "Ordo IA", feature: "ia" },
];

function isActive(pathname: string, route: string) {
  if (route === "/gestao") return pathname === "/gestao";
  return pathname === route || pathname.startsWith(route + "/");
}

export function GestaoShell({
  establishmentName,
  email,
  role,
  plan,
  children,
  linkOverrides,
}: {
  establishmentName: string;
  email: string | null;
  role: string;
  plan: Plan;
  children: React.ReactNode;
  // Opcional: reescreve o href de itens de navegação (rota real → href alvo).
  // Usado pela demo pública para a sidebar navegar entre as simulações.
  linkOverrides?: Record<string, string>;
}) {
  const pathname = usePathname();
  const ulRef = useRef<HTMLUListElement>(null);
  const activeIdx = NAV.findIndex((n) => isActive(pathname, n.route));

  // Efeito de proximidade da sidebar: cada item tem `--effect` (0→1) que o
  // desloca e o acende para o vermelho. O item ativo fica sempre a 1. Congela
  // com prefers-reduced-motion.
  useEffect(() => {
    const ul = ulRef.current;
    if (!ul) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const items = () => Array.from(ul.querySelectorAll<HTMLElement>("[data-idx]"));
    const targets: Record<string, number> = {};
    const current: Record<string, number> = {};
    let raf: number | null = null;
    let last = 0;
    const smoothing = 90;
    const radius = 115;
    const falloff = (p: number) => p * p * (3 - 2 * p);

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const k = 1 - Math.exp(-dt / (smoothing / 1000));
      let moving = false;
      items().forEach((el) => {
        const i = el.getAttribute("data-idx")!;
        const active = el.dataset.active === "1" ? 1 : 0;
        const target = Math.max(targets[i] || 0, active);
        const cur = current[i] || 0;
        const next = cur + (target - cur) * k;
        const settled = Math.abs(target - next) < 0.0015;
        const val = settled ? target : next;
        current[i] = val;
        el.style.setProperty("--effect", val.toFixed(4));
        if (!settled) moving = true;
      });
      raf = moving ? requestAnimationFrame(frame) : null;
    };
    const start = () => {
      if (raf != null) cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      const rect = ul.getBoundingClientRect();
      const y = e.clientY - rect.top;
      items().forEach((el) => {
        const i = el.getAttribute("data-idx")!;
        const center = el.offsetTop + el.offsetHeight / 2;
        targets[i] = falloff(Math.max(0, 1 - Math.abs(y - center) / radius));
      });
      start();
    };
    const onLeave = () => {
      Object.keys(targets).forEach((k) => (targets[k] = 0));
      start();
    };
    ul.addEventListener("pointermove", onMove);
    ul.addEventListener("pointerleave", onLeave);
    start();
    return () => {
      ul.removeEventListener("pointermove", onMove);
      ul.removeEventListener("pointerleave", onLeave);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  const initial = establishmentName.trim().charAt(0).toUpperCase() || "O";

  return (
    <div className="gs-root">
      <style>{GESTAO_CSS}</style>

      <aside className="gs-side">
        <Link href="/gestao" className="gs-brand">
          <span className="gs-brand-mark">{initial}</span>
          <span className="gs-brand-txt">
            <span className="gs-brand-name">{establishmentName}</span>
            <span className="gs-brand-sub">Gestão</span>
          </span>
        </Link>

        <ul className="gs-nav" ref={ulRef}>
          {NAV.map((item, i) => {
            const override = linkOverrides?.[item.route];
            const active = override ? pathname === override : i === activeIdx;
            const locked = item.feature ? !hasFeature(plan, item.feature) : false;
            return (
              <li key={item.route} data-idx={i} data-active={active ? "1" : "0"}>
                <Link
                  href={override ?? item.route}
                  className={"gs-navlink" + (active ? " is-active" : "")}
                >
                  <span className="gs-tick" />
                  <span className="gs-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="gs-label">{item.label}</span>
                  {locked && <LockIcon />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="gs-foot">
          <Link href="/atendimento" className="gs-foot-link">
            Atendimento
          </Link>
          <Link href="/cozinha" className="gs-foot-link">
            Cozinha
          </Link>
          <Link href="/conta" className="gs-foot-link">
            Conta
          </Link>
          <form action={signOut}>
            <button type="submit" className="gs-foot-link gs-foot-btn">
              Sair
            </button>
          </form>
          <p className="gs-foot-user">
            {email} · {role}
          </p>
        </div>
      </aside>

      <div className="gs-main">{children}</div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      className="gs-lock"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

// Paleta da marca Ordo: acento #d41d0d (era #E5484D no design). Escopado a
// `.gs-root`; cobre a sidebar (.gs-*) e o hub/sub-páginas (.gh-*).
const GESTAO_CSS = `
.gs-root { --gs-accent: #d41d0d; --gs-accent-hover: #b01808; --gs-accent-weak: rgba(212,29,13,.10); --gs-accent-border: rgba(212,29,13,.22); --gs-bg: #f5f5f3; --gs-surface: #fff; --gs-ink: #191919; --gs-muted: rgba(0,0,0,.5); --gs-line: rgba(0,0,0,.07); --gs-marker: rgba(0,0,0,.16); --gs-navtext: rgba(0,0,0,.42);
  display: flex; align-items: stretch; min-height: 100vh; background: var(--gs-bg); color: var(--gs-ink);
  font-family: var(--font-manrope), ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased;
  /* Remapeia os tokens do design system (usados pelas sub-páginas via Tailwind:
     bg-surface, text-ink, bg-brand…) para a paleta do design/marca Ordo. Assim
     as sub-páginas herdam cores + fonte sem alterar o seu código. */
  --color-canvas: #f5f5f3; --color-surface: #ffffff; --color-surface-2: #efeeec;
  --color-ink: #191919; --color-muted: rgba(0,0,0,.5); --color-line: rgba(0,0,0,.08);
  --color-brand: #d41d0d; --color-brand-strong: #b01808; --color-brand-ink: #ffffff;
  --color-brand-weak: rgba(212,29,13,.10); }
/* Cartões/superfícies das sub-páginas ganham o raio mais suave do design. */
.gs-main .rounded-2xl { border-radius: 20px; }
.gs-main .rounded-xl { border-radius: 14px; }
.gs-root a { text-decoration: none; }

/* Sidebar */
.gs-side { position: sticky; top: 0; align-self: flex-start; height: 100vh; flex: 0 0 236px; padding: 32px 22px; display: flex; flex-direction: column; background: rgba(255,255,255,.5); backdrop-filter: blur(8px); border-right: 1px solid var(--gs-line); }
.gs-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 30px; }
.gs-brand-mark { width: 32px; height: 32px; flex: 0 0 auto; border-radius: 10px; background: var(--gs-accent); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; box-shadow: 0 4px 12px -4px rgba(212,29,13,.6); }
.gs-brand-txt { line-height: 1.15; min-width: 0; }
.gs-brand-name { display: block; font-size: 14px; font-weight: 800; letter-spacing: -.01em; color: var(--gs-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
.gs-brand-sub { display: block; font-size: 11px; color: rgba(0,0,0,.4); }

.gs-nav { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.gs-nav li { --effect: 0; }
.gs-navlink { display: flex; align-items: center; gap: 11px; padding: 5px 0; transform: translateX(calc(var(--effect,0) * 22px)); }
.gs-tick { height: 2px; border-radius: 2px; flex: 0 0 auto; width: calc(38px * (0.32 + 0.68 * var(--effect,0))); background: color-mix(in srgb, var(--gs-marker) calc((1 - var(--effect,0)) * 100%), var(--gs-accent)); }
.gs-num { font-size: 9.5px; font-weight: 700; font-variant-numeric: tabular-nums; opacity: .55; color: color-mix(in srgb, var(--gs-navtext) calc((1 - var(--effect,0)) * 100%), var(--gs-accent)); }
.gs-label { font-size: 13.5px; font-weight: 600; white-space: nowrap; color: color-mix(in srgb, var(--gs-navtext) calc((1 - var(--effect,0)) * 100%), var(--gs-accent)); }
.gs-navlink.is-active .gs-label, .gs-navlink.is-active .gs-num { color: var(--gs-accent); }
.gs-lock { flex: 0 0 auto; color: rgba(0,0,0,.3); }

.gs-foot { margin-top: auto; padding-top: 20px; display: flex; flex-direction: column; gap: 2px; border-top: 1px solid var(--gs-line); }
.gs-foot-link { font-size: 13px; font-weight: 600; color: var(--gs-muted); padding: 6px 0; background: none; border: none; text-align: left; font-family: inherit; cursor: pointer; transition: color .15s; }
.gs-foot-link:hover { color: var(--gs-accent); }
.gs-foot-user { margin: 8px 0 0; font-size: 11px; color: rgba(0,0,0,.38); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.gs-main { flex: 1; min-width: 0; padding: 34px 30px 90px; }

/* ---- Hub (.gh-*) ---- */
.gh-wrap { max-width: 760px; margin: 0 auto; animation: gsFade .5s ease both; }
@keyframes gsFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.gh-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
.gh-title { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -.02em; }
.gh-welcome { margin: 6px 0 0; font-size: 14px; color: var(--gs-muted); }
.gh-plan { display: inline-flex; align-items: center; gap: 6px; background: var(--gs-accent); color: #fff; font-size: 12px; font-weight: 700; padding: 6px 13px; border-radius: 999px; box-shadow: 0 4px 12px -4px rgba(212,29,13,.55); white-space: nowrap; }
.gh-plan-dot { width: 6px; height: 6px; border-radius: 999px; background: #fff; opacity: .85; }

.gh-metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 22px; }
.gh-metric { background: var(--gs-surface); border: 1px solid var(--gs-line); border-radius: 20px; padding: 18px; }
.gh-metric-label { font-size: 12px; font-weight: 600; color: rgba(0,0,0,.45); margin-bottom: 8px; }
.gh-metric-value { font-size: 28px; font-weight: 800; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.gh-metric-value.is-accent { color: var(--gs-accent); }
.gh-metric-note { margin: 8px 2px 0; font-size: 12px; color: var(--gs-muted); }

.gh-grid { position: relative; display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
.gh-spot { position: absolute; inset: 0; pointer-events: none; z-index: 5; border-radius: 24px; background: radial-gradient(220px circle at var(--mx,-999px) var(--my,-999px), rgba(212,29,13,.10), transparent 65%); }
.gh-card { text-align: left; position: relative; overflow: hidden; background: var(--gs-surface); border: 1px solid var(--gs-accent-border); border-radius: 22px; padding: 20px; cursor: pointer; transition: transform .25s cubic-bezier(.34,1.2,.4,1), box-shadow .25s, border-color .25s; will-change: transform; display: block; }
.gh-card.is-wide { grid-column: span 2; }
.gh-card.is-locked { border-color: var(--gs-line); }
.gh-glow { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .3s; }
.gh-card-top { position: relative; display: flex; align-items: flex-start; justify-content: space-between; }
.gh-card-icon { width: 46px; height: 46px; flex: 0 0 auto; border-radius: 13px; background: var(--gs-accent-weak); display: flex; align-items: center; justify-content: center; color: var(--gs-accent); }
.gh-card-title { position: relative; font-size: 16px; font-weight: 700; margin-top: 16px; color: var(--gs-ink); }
.gh-card-desc { position: relative; font-size: 13px; color: var(--gs-muted); margin-top: 3px; line-height: 1.4; }
.gh-chev { color: rgba(0,0,0,.28); }
.gh-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,.05); color: rgba(0,0,0,.55); font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 999px; }
.gh-wide-row { position: relative; display: flex; align-items: center; gap: 16px; }
.gh-wide-row .gh-card-title, .gh-wide-row .gh-card-desc { margin-top: 0; }

@media (max-width: 900px) {
  .gs-root { flex-direction: column; }
  .gs-side { position: sticky; top: 0; z-index: 30; flex: none; height: auto; width: 100%; flex-direction: row; align-items: center; gap: 14px; padding: 12px 16px; overflow-x: auto; }
  .gs-brand { margin-bottom: 0; }
  .gs-nav { flex-direction: row; gap: 10px; }
  .gs-navlink { transform: none; padding: 4px 0; }
  .gs-tick { display: none; }
  .gs-foot { margin-top: 0; margin-left: auto; padding-top: 0; border-top: none; flex-direction: row; gap: 12px; align-items: center; }
  .gs-foot-user { display: none; }
  .gs-main { padding: 20px 16px 80px; }
  .gh-metrics { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .gh-wrap { animation: none; }
}
`;
