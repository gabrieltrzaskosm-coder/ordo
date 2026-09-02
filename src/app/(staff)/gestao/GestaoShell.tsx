"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Banner } from "@/components/ui/banner";
import { hasFeature, type Feature, type Plan } from "@/lib/plans";

// Chrome da área de gestão: sidebar fixa (navegação numerada) + rodapé com
// atalhos operacionais e sair. Port do design do
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

function sectionLabel(pathname: string) {
  const item = NAV.find((entry) => isActive(pathname, entry.route));
  return item ? `${String(NAV.indexOf(item) + 1).padStart(2, "0")} / ${item.label}` : "ORDO / GESTÃO";
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
  const activeIdx = NAV.findIndex((n) => isActive(pathname, n.route));

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

        <ul className="gs-nav">
          {NAV.map((item, i) => {
            const override = linkOverrides?.[item.route];
            const active = override ? pathname === override : i === activeIdx;
            const locked = item.feature ? !hasFeature(plan, item.feature) : false;
            return (
              <li key={item.route} data-idx={i} data-active={active ? "1" : "0"}>
                <Link
                  href={override ?? item.route}
                  className={"gs-navlink" + (active ? " is-active" : "")}
                  aria-current={active ? "page" : undefined}
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

      <div className="gs-main">
        <Banner
          message="Operação em ordem. Acompanhe o ritmo do seu restaurante."
          height="2rem"
          variant="rainbow"
          className="gs-banner"
        />
        <div className="gs-content-frame" data-section={sectionLabel(pathname)}>
          <div className="gs-page-content">{children}</div>
        </div>
      </div>
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
/* Tratamento editorial compartilhado pelas superfícies das sub-páginas. */
.gs-main .rounded-2xl { border-radius: 12px; }
.gs-main .rounded-xl { border-radius: 10px; }
.gs-main [class*="rounded-["] { border-radius: 12px; }
.gs-main [class*="shadow-"] { box-shadow: 0 1px 2px rgba(25,25,25,.045); }
.gs-root a { text-decoration: none; }

/* Sidebar */
.gs-side { position: sticky; top: 0; align-self: flex-start; height: 100vh; flex: 0 0 236px; padding: 32px 22px; display: flex; flex-direction: column; background: #fff; border-right: 1px solid var(--gs-line); }
.gs-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 30px; }
.gs-brand-mark { width: 32px; height: 32px; flex: 0 0 auto; border-radius: 10px; background: var(--gs-accent); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; box-shadow: 0 4px 12px -4px rgba(212,29,13,.6); }
.gs-brand-txt { line-height: 1.15; min-width: 0; }
.gs-brand-name { display: block; font-size: 14px; font-weight: 800; letter-spacing: -.01em; color: var(--gs-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
.gs-brand-sub { display: block; font-size: 11px; color: rgba(0,0,0,.4); }

.gs-nav { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.gs-nav li { --effect: 0; }
.gs-navlink { display: flex; align-items: center; gap: 11px; padding: 8px 9px; border-left: 2px solid transparent; border-radius: 4px; transform: none; transition: background .18s, border-color .18s, color .18s; }
.gs-tick { height: 2px; border-radius: 2px; flex: 0 0 auto; width: calc(38px * (0.32 + 0.68 * var(--effect,0))); background: color-mix(in srgb, var(--gs-marker) calc((1 - var(--effect,0)) * 100%), var(--gs-accent)); }
.gs-num { font-size: 9.5px; font-weight: 700; font-variant-numeric: tabular-nums; opacity: .55; color: color-mix(in srgb, var(--gs-navtext) calc((1 - var(--effect,0)) * 100%), var(--gs-accent)); }
.gs-label { font-size: 13.5px; font-weight: 600; white-space: nowrap; color: color-mix(in srgb, var(--gs-navtext) calc((1 - var(--effect,0)) * 100%), var(--gs-accent)); }
.gs-navlink:hover { background: #faf7f6; }
.gs-navlink.is-active { background: var(--gs-accent-weak); border-left-color: var(--gs-accent); }
.gs-navlink.is-active .gs-label, .gs-navlink.is-active .gs-num { color: var(--gs-accent); }
.gs-lock { flex: 0 0 auto; color: rgba(0,0,0,.3); }

.gs-foot { margin-top: auto; padding-top: 20px; display: flex; flex-direction: column; gap: 2px; border-top: 1px solid var(--gs-line); }
.gs-foot-link { font-size: 13px; font-weight: 600; color: var(--gs-muted); padding: 6px 0; background: none; border: none; text-align: left; font-family: inherit; cursor: pointer; transition: color .15s; }
.gs-foot-link:hover { color: var(--gs-accent); }
.gs-foot-user { margin: 8px 0 0; font-size: 11px; color: rgba(0,0,0,.38); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.gs-main { flex: 1; min-width: 0; padding: 28px 30px 90px; }
.gs-page-content { min-width: 0; }
.gs-content-frame { position: relative; min-height: calc(100vh - 126px); padding: 44px 30px 34px; background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 14px; box-shadow: 0 8px 24px rgba(25,25,25,.035); }
.gs-content-frame::before { content: attr(data-section); position: absolute; top: 18px; left: 30px; color: var(--gs-accent); font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.gs-page-content h1:not(.gh-title) { font-size: clamp(26px, 3vw, 32px); line-height: 1.05; letter-spacing: -.035em; }
.gs-page-content h2 { letter-spacing: -.02em; }
.gs-banner { width: 100%; margin: -4px auto 28px; }

/* Faixa partilhada pelo hub e por todas as sub-páginas. A variante rainbow é
   uma adaptação sóbria do exemplo de referência, usando a paleta Ordo. */
.ui-banner { position: relative; display: flex; align-items: center; justify-content: center; gap: 8px; min-height: var(--banner-height, 2rem); overflow: hidden; border: 1px solid rgba(212,29,13,.14); border-radius: 12px; padding: 5px 14px; color: #191919; font-size: 11px; font-weight: 700; letter-spacing: .01em; line-height: 1.2; }
.ui-banner::before { position: absolute; inset: 0; content: ""; background: rgba(255,255,255,.78); }
.ui-banner-rainbow { background: linear-gradient(90deg, #f7c6bd 0%, #f8dfaa 34%, #d7e7d1 68%, #c8dceb 100%); }
.ui-banner-default { background: #fff; }
.ui-banner-mark, .ui-banner-message { position: relative; z-index: 1; }
.ui-banner-mark { width: 6px; height: 6px; flex: 0 0 auto; border-radius: 999px; background: var(--gs-accent, #d41d0d); box-shadow: 0 0 0 4px rgba(212,29,13,.12); }


/* ---- Hub (.gh-*) ---- */
.gh-wrap { max-width: 960px; margin: 0 auto; animation: gsFade .5s ease both; }
@keyframes gsFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.gh-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid var(--gs-line); }
.gh-title { margin: 0; font-size: clamp(28px, 4vw, 36px); font-weight: 800; letter-spacing: -.03em; }
.gh-welcome { margin: 6px 0 0; font-size: 14px; color: var(--gs-muted); }
.gh-plan { display: inline-flex; align-items: center; gap: 6px; background: var(--gs-accent); color: #fff; font-size: 12px; font-weight: 700; padding: 6px 13px; border-radius: 999px; box-shadow: 0 4px 12px -4px rgba(212,29,13,.55); white-space: nowrap; }
.gh-plan-dot { width: 6px; height: 6px; border-radius: 999px; background: #fff; opacity: .85; }

.gh-metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; margin-bottom: 22px; border-top: 1px solid var(--gs-line); border-bottom: 1px solid var(--gs-line); }
.gh-metrics > * + * { border-left: 1px solid var(--gs-line); }
.gh-metric { background: var(--gs-surface); padding: 18px 20px; }
.gh-metric-label { font-size: 12px; font-weight: 600; color: rgba(0,0,0,.45); margin-bottom: 8px; }
.gh-metric-value { font-size: 28px; font-weight: 800; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.gh-metric-value.is-accent { color: var(--gs-accent); }
.gh-metric-note { margin: 8px 2px 0; font-size: 12px; color: var(--gs-muted); }

.gh-grid { position: relative; display: grid; grid-template-columns: repeat(2,1fr); gap: 0; border-top: 1px solid var(--gs-line); }
.gh-card { text-align: left; position: relative; overflow: hidden; background: var(--gs-surface); border: 0; border-bottom: 1px solid var(--gs-line); border-right: 1px solid var(--gs-line); border-radius: 0; padding: 22px 20px; cursor: pointer; transition: background .2s, color .2s; display: block; }
.gh-card:hover { background: #fff7f5; }
.gh-card.is-wide { grid-column: span 2; }
.gh-card.is-locked { border-color: var(--gs-line); }
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
  .gs-main { padding: 16px 16px 80px; }
  .gs-content-frame { min-height: calc(100vh - 106px); padding: 18px 14px 28px; border-radius: 18px; }
  .gs-content-frame::before { top: 12px; left: 14px; }
  .gs-content-frame { padding-top: 38px; }
  .gs-banner { margin: 0 auto 18px; max-width: none; }
  .gh-metrics { grid-template-columns: 1fr; }
  .gh-metrics > * + * { border-left: 0; border-top: 1px solid var(--gs-line); }
  .gh-grid { grid-template-columns: 1fr; }
  .gh-card.is-wide { grid-column: auto; }
  .gh-head { flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) {
  .gh-wrap { animation: none; }
}
`;
