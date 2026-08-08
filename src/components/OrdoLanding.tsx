"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Landing pública da Ordo (produto da Otium). Port fiel do design feito no
 * Claude Design (runtime x-dc/DCLogic) para React/Next. Paleta quente e ousada
 * (hex fixos, iguais aos tokens --l-* do globals.css). Todo o CSS está escopado
 * em `.ol-*` + um <style> local para NÃO tocar nos temas da app.
 *
 * Interatividade (client): hero "spotlight" que segue o cursor, sidebar com
 * scroll-spy + proximidade, e reveals on-scroll. Tudo congela com
 * prefers-reduced-motion.
 */

const NAV = [
  { id: "inicio", label: "Início" },
  { id: "diferenciais", label: "Diferenciais" },
  { id: "como", label: "Como Funciona" },
  { id: "planos", label: "Planos" },
  { id: "contato", label: "Contato" },
] as const;

const DIFERENCIAIS = [
  ["0%", "0% de comissão", "Você recebe 100% da venda. Nada de taxa por pedido comendo a sua margem."],
  ["⏱", "Menos fila, mais giro", "O cliente pede e paga sozinho — a mesa vira mais rápido e você atende mais gente."],
  ["👥", "Menos garçom no rush", "Cada cliente se atende. A equipe foca no que importa quando o salão lota."],
  ["📷", "Sem app pra baixar", "Só a câmera do celular. Escaneou, abriu, pediu. Funciona na hora."],
  ["✎", "Cardápio sempre atual", "Muda preço e item num clique. Esgotou? Marca e some da tela na hora."],
  ["★", "Mais avaliações no Google", "No fim do pedido, o cliente satisfeito é convidado a avaliar o seu negócio."],
] as const;

const PASSOS = [
  ["1", "Cliente escaneia o QR Code", "Aponta a câmera do celular para o QR da mesa. Sem baixar nada, o cardápio abre na hora."],
  ["2", "Faz o pagamento pelo próprio aparelho", "Paga por Pix, cartão ou Apple Pay direto no celular, sem esperar a conta."],
  ["3", "Pedido enviado para a cozinha", "O pedido cai na cozinha em tempo real e o dinheiro entra na conta do restaurante."],
  ["4", "Pedido pronto — cliente recebe atualizações", "O status muda em tempo real: em preparo, pronto, a caminho."],
  ["5", "Pedido entregue ao cliente", "A comida chega à mesa. No fim, o cliente é convidado a avaliar no Google."],
] as const;

const PLANOS = [
  {
    name: "Basic",
    tagline: "O essencial para começar hoje.",
    highlight: false,
    feats: [
      "Cardápio digital por QR code",
      "Pedido em tempo real na cozinha",
      "Pagamento Pix, cartão e Apple Pay",
      "Marcar item como esgotado",
    ],
  },
  {
    name: "Pro",
    tagline: "Tudo do Basic + inteligência de vendas.",
    highlight: false,
    feats: [
      "Balanço financeiro diário e mensal",
      "Exportação de relatórios",
      "Insights: horas de pico e ticket médio",
      "Mais vendidos e tendências",
    ],
  },
  {
    name: "Max",
    tagline: "Tudo do Pro + automação e IA.",
    highlight: true,
    feats: [
      "Controle de estoque automático",
      "IA: resumo do dia e da semana",
      "Previsão de procura e destaque do mais pedido",
      "Suporte 24/7",
    ],
  },
] as const;

const STEP_LTR = "M6 0 C6 42, 94 12, 94 56";
const STEP_RTL = "M94 0 C94 42, 6 12, 6 56";

export function OrdoLanding() {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // ---- Reveals on-scroll ----
    const revealEls = Array.from(
      root.querySelectorAll<HTMLElement>(".ol-reveal")
    );
    let io: IntersectionObserver | undefined;
    if (reduce) {
      revealEls.forEach((el) => el.classList.add("is-in"));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-in");
              io!.unobserve(en.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach((el) => io!.observe(el));
    }

    // ---- Scroll-spy ----
    const onScroll = () => {
      const mid = window.innerHeight * 0.4;
      let cur = 0;
      NAV.forEach(({ id }, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mid) cur = i;
      });
      setActive((prev) => (prev === cur ? prev : cur));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // ---- Spotlight (hero) + sidebar proximity ----
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let target = { ...mouse };
    const onMove = (e: MouseEvent) => {
      target = { x: e.clientX, y: e.clientY };
      mouse = { x: e.clientX, y: e.clientY };
    };

    const NUM = 6;
    const pts = Array.from({ length: NUM }, () => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }));
    let raf = 0;

    const placeTrail = () => {
      const s = svgRef.current;
      if (!s) return;
      const rect = s.getBoundingClientRect();
      for (let i = 0; i < NUM; i++) {
        const c = s.querySelector<SVGCircleElement>("#ol-trail-" + i);
        if (c) {
          c.setAttribute("cx", String(pts[i].x - rect.left));
          c.setAttribute("cy", String(pts[i].y - rect.top));
        }
      }
    };

    if (reduce) {
      placeTrail();
    } else {
      window.addEventListener("mousemove", onMove);
      const bar = sidebarRef.current;
      const animate = () => {
        const s = svgRef.current;
        if (s) {
          const rect = s.getBoundingClientRect();
          pts[0].x += (target.x - pts[0].x) * 0.2;
          pts[0].y += (target.y - pts[0].y) * 0.2;
          for (let i = 1; i < NUM; i++) {
            pts[i].x += (pts[i - 1].x - pts[i].x) * 0.35;
            pts[i].y += (pts[i - 1].y - pts[i].y) * 0.35;
          }
          for (let i = 0; i < NUM; i++) {
            const c = s.querySelector<SVGCircleElement>("#ol-trail-" + i);
            if (c) {
              c.setAttribute("cx", String(pts[i].x - rect.left));
              c.setAttribute("cy", String(pts[i].y - rect.top));
            }
          }
        }
        if (bar) {
          bar.querySelectorAll<HTMLElement>("[data-nav]").forEach((a) => {
            const r = a.getBoundingClientRect();
            const cy = r.top + r.height / 2;
            const prox = Math.max(0, 1 - Math.abs(mouse.y - cy) / 150);
            a.style.transform = `translateX(${(prox * 26).toFixed(1)}px)`;
          });
        }
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
    }

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="ol-root" ref={rootRef}>
      <style>{CSS}</style>

      {/* ===== Sidebar de navegação ===== */}
      <nav className="ol-sidebar" aria-label="Seções">
        <div className="ol-sidebar-inner" ref={sidebarRef}>
          {NAV.map((item, i) => (
            <a
              key={item.id}
              href={"#" + item.id}
              data-nav
              onClick={scrollTo(item.id)}
              className={"ol-nav" + (i === active ? " is-active" : "")}
            >
              <span className="ol-nav-tick" />
              <span className="ol-nav-idx">{"0" + (i + 1)}</span>
              <span className="ol-nav-label">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* ===== Hero / spotlight ===== */}
      <section id="inicio" className="ol-hero">
        <div className="ol-hero-motion">
          <div className="ol-hero-grad ol-anim" />
        </div>

        <svg ref={svgRef} className="ol-hero-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="ol-hole">
              <stop offset="0%" stopColor="black" stopOpacity="1" />
              <stop offset="60%" stopColor="black" stopOpacity="0.8" />
              <stop offset="100%" stopColor="black" stopOpacity="0" />
            </radialGradient>
            <pattern
              id="ol-poster"
              width="26"
              height="26"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="26" height="26" fill="#0c0906" />
              <rect width="13" height="26" fill="#120d08" />
            </pattern>
            <mask
              id="ol-mask"
              maskContentUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="100%"
              height="100%"
            >
              <rect width="100%" height="100%" fill="white" />
              <circle id="ol-trail-5" cx="-1000" cy="-1000" r="245" fill="url(#ol-hole)" opacity="0.25" />
              <circle id="ol-trail-4" cx="-1000" cy="-1000" r="280" fill="url(#ol-hole)" opacity="0.4" />
              <circle id="ol-trail-3" cx="-1000" cy="-1000" r="315" fill="url(#ol-hole)" opacity="0.55" />
              <circle id="ol-trail-2" cx="-1000" cy="-1000" r="350" fill="url(#ol-hole)" opacity="0.7" />
              <circle id="ol-trail-1" cx="-1000" cy="-1000" r="385" fill="url(#ol-hole)" opacity="0.85" />
              <circle id="ol-trail-0" cx="-1000" cy="-1000" r="420" fill="url(#ol-hole)" opacity="1" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#ol-poster)" mask="url(#ol-mask)" />
        </svg>
        <div className="ol-hero-scrim" />

        <div className="ol-hero-content">
          <div className="ol-badge">
            <span className="ol-badge-dot ol-anim" />
            <span className="ol-badge-txt">Ordo · by Otium</span>
          </div>
          <h1 className="ol-hero-title">
            Mais autonomia ao seu cliente,
            <br />
            <span className="ol-italic ol-amber">mais dinheiro</span> no seu bolso
          </h1>
          <p className="ol-hero-sub">
            Pedidos e pagamentos por QR Code, para restaurantes que querem ter
            mais lucros.
          </p>
          <div className="ol-hero-ctas">
            <a href="#contato" onClick={scrollTo("contato")} className="ol-cta-primary">
              FORMULÁRIO<span className="ol-arrow">→</span>
            </a>
            <a href="#como" onClick={scrollTo("como")} className="ol-cta-ghost">
              Como funciona
            </a>
          </div>
        </div>

        <div className="ol-hero-scroll ol-anim">
          <span className="ol-hero-scroll-txt">mova o cursor</span>
          <span className="ol-hero-scroll-arrow">↓</span>
        </div>
      </section>

      {/* ===== Diferenciais ===== */}
      <section id="diferenciais" className="ol-sec">
        <div className="ol-reveal ol-head">
          <span className="ol-eyebrow ol-eyebrow-red">Diferenciais</span>
          <h2 className="ol-h2">
            Menos espera do cliente por atendimento, mais eficiência, contas
            fecham mais altas.
          </h2>
        </div>
        <div className="ol-grid-cards">
          {DIFERENCIAIS.map(([icon, title, body], i) => (
            <div
              key={title}
              className="ol-reveal ol-card"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="ol-card-icon">{icon}</div>
              <h3 className="ol-card-title">{title}</h3>
              <p className="ol-card-body">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Como funciona ===== */}
      <section id="como" className="ol-como">
        <div className="ol-como-inner">
          <div className="ol-reveal ol-head">
            <span className="ol-eyebrow ol-eyebrow-amber">Como funciona</span>
            <h2 className="ol-h2 ol-h2-light">
              Cinco passos. Zero download. Do escaneio à entrega.
            </h2>
          </div>
          <div className="ol-steps">
            {PASSOS.map(([num, title, body], i) => {
              const left = i % 2 === 0;
              const last = i === PASSOS.length - 1;
              return (
                <div key={num}>
                  <div
                    className="ol-reveal ol-step-row"
                    style={{
                      justifyContent: left ? "flex-start" : "flex-end",
                      transitionDelay: `${i * 70}ms`,
                    }}
                  >
                    <div
                      className="ol-step-group"
                      style={{
                        flexDirection: left ? "row" : "row-reverse",
                        textAlign: left ? "left" : "right",
                      }}
                    >
                      <div
                        className={"ol-step-node" + (last ? " is-last" : "")}
                      >
                        {num}
                      </div>
                      <div>
                        <h3 className="ol-step-title">{title}</h3>
                        <p className="ol-step-body">{body}</p>
                      </div>
                    </div>
                  </div>
                  {!last && (
                    <svg
                      viewBox="0 0 100 56"
                      preserveAspectRatio="none"
                      className="ol-connector"
                    >
                      <path
                        d={left ? STEP_LTR : STEP_RTL}
                        fill="none"
                        stroke="#f5b400"
                        strokeWidth="2"
                        strokeOpacity="0.5"
                        strokeLinecap="round"
                        strokeDasharray="1 6"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Planos ===== */}
      <section id="planos" className="ol-sec">
        <div className="ol-reveal ol-head">
          <span className="ol-eyebrow ol-eyebrow-red">Planos</span>
          <h2 className="ol-h2">
            Entenda os planos, nós te direcionamos o melhor para o seu negócio.
          </h2>
        </div>

        {/* Filtro "electric" do card em destaque */}
        <svg className="ol-electric-defs" aria-hidden="true">
          <defs>
            <filter
              id="ol-electric"
              colorInterpolationFilters="sRGB"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
              <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
              </feOffset>
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
              <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
              </feOffset>
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise3" seed="2" />
              <feOffset in="noise3" dx="0" dy="0" result="offsetNoise3">
                <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
              </feOffset>
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise4" seed="2" />
              <feOffset in="noise4" dx="0" dy="0" result="offsetNoise4">
                <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
              </feOffset>
              <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
              <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
              <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
              <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
            </filter>
          </defs>
        </svg>

        <div className="ol-grid-plans">
          {PLANOS.map((p, i) => (
            <div
              key={p.name}
              className={
                "ol-reveal ol-plan" + (p.highlight ? " is-hl" : "")
              }
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              {p.highlight && (
                <>
                  <div className="ol-plan-bgglow" />
                  <div className="ol-plan-glow2" />
                  <div className="ol-plan-glow1" />
                  <div className="ol-plan-stroke" />
                </>
              )}
              <h3 className="ol-plan-name">{p.name}</h3>
              <p className="ol-plan-tagline">{p.tagline}</p>
              <ul className="ol-plan-feats">
                {p.feats.map((f) => (
                  <li key={f} className="ol-plan-feat">
                    <span className="ol-plan-check">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Contato ===== */}
      <section id="contato" className="ol-contato">
        <div className="ol-reveal ol-contato-head">
          <span className="ol-eyebrow ol-eyebrow-red">Contato</span>
          <h2 className="ol-h2 ol-h2-big">
            Em poucos passos você pode ganhar mais dinheiro e atender melhor os
            seus clientes.
          </h2>
          <p className="ol-contato-sub">
            Preencha o formulário e a nossa equipe entra em contato para
            configurar o seu cardápio digital.
          </p>
          <a
            href="mailto:otium.sap@gmail.com?subject=Quero%20conhecer%20a%20Ordo"
            className="ol-cta-primary"
          >
            FORMULÁRIO<span className="ol-arrow">→</span>
          </a>
          <a href="mailto:otium.sap@gmail.com" className="ol-contato-mail">
            otium.sap@gmail.com
          </a>
        </div>

        <div className="ol-footer">
          <span className="ol-footer-brand">
            Ordo<span className="ol-amber-dot">.</span>
          </span>
          <div className="ol-footer-links">
            <Link href="/termos">Termos</Link>
            <Link href="/privacidade">Privacidade e LGPD</Link>
            <Link href="/login">Entrar</Link>
          </div>
          <span className="ol-footer-copy">
            {`© ${new Date().getFullYear()} Otium · Pedido & pagamento por QR code`}
          </span>
        </div>
      </section>
    </div>
  );
}

const CSS = `
.ol-root { position: relative; width: 100%; overflow-x: clip; background: #fbf8f4; color: #2a1c10; font-family: var(--font-manrope), ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.ol-root a { text-decoration: none; }
.ol-italic { font-style: italic; }
.ol-amber { color: #f5b400; }

@keyframes olShimmer { 0% { transform: translate(-8%, -6%) scale(1.15); } 50% { transform: translate(8%, 6%) scale(1.25); } 100% { transform: translate(-8%, -6%) scale(1.15); } }
@keyframes olPulse { 0%,100% { opacity: .55; } 50% { opacity: .9; } }
@keyframes olFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

/* Sidebar */
.ol-sidebar { position: fixed; left: 0; top: 0; height: 100vh; width: 190px; z-index: 60; display: flex; flex-direction: column; justify-content: center; padding-left: 26px; mix-blend-mode: difference; pointer-events: none; }
.ol-sidebar-inner { display: flex; flex-direction: column; gap: 20px; pointer-events: auto; }
.ol-nav { display: flex; align-items: center; gap: 12px; transition: transform .18s cubic-bezier(.2,.8,.2,1); }
.ol-nav-tick { width: 20px; height: 2px; background: #ffffff; transition: all .3s ease; flex: none; }
.ol-nav.is-active .ol-nav-tick { width: 34px; background: #d41d0d; }
.ol-nav-idx { font-family: ui-monospace, Menlo, monospace; font-size: 10px; color: #ffffff; opacity: .55; }
.ol-nav.is-active .ol-nav-idx { color: #d41d0d; opacity: 1; }
.ol-nav-label { font-size: 12px; font-weight: 600; color: #ffffff; opacity: .5; letter-spacing: .02em; transition: opacity .3s ease; }
.ol-nav.is-active .ol-nav-label { opacity: 1; }
@media (max-width: 900px) { .ol-sidebar { display: none; } }

/* Hero */
.ol-hero { position: relative; height: 100dvh; min-height: 620px; width: 100%; background: #0c0906; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.ol-hero-motion { position: absolute; inset: 0; overflow: hidden; }
.ol-hero-grad { position: absolute; inset: -20%; background: radial-gradient(circle at 30% 30%, #d41d0d 0%, rgba(212,29,13,0) 55%), radial-gradient(circle at 70% 60%, #f5b400 0%, rgba(245,180,0,0) 50%), linear-gradient(120deg, #2a1c10, #0c0906); animation: olShimmer 14s ease-in-out infinite; }
.ol-hero-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.ol-hero-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(12,9,6,.5) 0%, rgba(12,9,6,.15) 40%, rgba(12,9,6,.75) 100%); pointer-events: none; }
.ol-hero-content { position: relative; z-index: 10; max-width: 1000px; padding: 0 32px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 30px; }
.ol-badge { display: flex; align-items: center; gap: 10px; padding: 7px 16px; border: 1px solid rgba(255,255,255,.28); border-radius: 999px; backdrop-filter: blur(4px); }
.ol-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #f5b400; box-shadow: 0 0 12px #f5b400; animation: olPulse 2.4s ease-in-out infinite; }
.ol-badge-txt { font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.82); }
.ol-hero-title { margin: 0; font-family: var(--font-instrument-serif), Georgia, serif; font-weight: 400; font-size: clamp(44px, 8.4vw, 108px); line-height: 0.98; letter-spacing: -0.01em; color: #ffffff; text-wrap: balance; text-shadow: 0 4px 40px rgba(0,0,0,.5); }
.ol-hero-sub { margin: 0; max-width: 560px; font-size: clamp(15px, 2vw, 19px); line-height: 1.5; color: rgba(255,255,255,.78); }
.ol-hero-ctas { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center; }
.ol-arrow { font-size: 20px; line-height: 1; }
.ol-cta-primary { display: inline-flex; align-items: center; gap: 10px; background: #d41d0d; color: #fff; font-weight: 700; font-size: 16px; letter-spacing: .04em; padding: 17px 36px; border-radius: 999px; box-shadow: 0 12px 34px rgba(212,29,13,.45); transition: transform .18s ease, background .18s ease, box-shadow .18s ease; }
.ol-cta-primary:hover { background: #b01808; color: #fff; transform: translateY(-2px); box-shadow: 0 16px 40px rgba(212,29,13,.55); }
.ol-cta-ghost { display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,.9); font-weight: 600; font-size: 15px; padding: 16px 8px; border-bottom: 1px solid rgba(255,255,255,.35); }
.ol-cta-ghost:hover { color: #fff; border-color: #fff; }
.ol-hero-scroll { position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%); z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 6px; animation: olFloat 2.6s ease-in-out infinite; }
.ol-hero-scroll-txt { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.55); }
.ol-hero-scroll-arrow { color: rgba(255,255,255,.55); font-size: 18px; }

/* Seções genéricas */
.ol-sec { position: relative; max-width: 1180px; margin: 0 auto; padding: clamp(80px, 12vw, 150px) 32px; }
.ol-head { max-width: 720px; margin-bottom: 56px; }
.ol-eyebrow { font-family: ui-monospace, monospace; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; font-weight: 600; }
.ol-eyebrow-red { color: #d41d0d; }
.ol-eyebrow-amber { color: #f5b400; }
.ol-h2 { margin: 16px 0 0; font-family: var(--font-instrument-serif), Georgia, serif; font-weight: 400; font-size: clamp(34px, 5.2vw, 60px); line-height: 1.04; letter-spacing: -0.01em; color: #2a1c10; text-wrap: balance; }
.ol-h2-light { color: #fbf8f4; }
.ol-h2-big { font-size: clamp(38px, 6vw, 74px); line-height: 1.0; }

/* Reveal */
.ol-reveal { opacity: 0; transform: translateY(28px); transition: opacity .8s ease, transform .8s ease; }
.ol-reveal.is-in { opacity: 1; transform: none; }

/* Diferenciais cards */
.ol-grid-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.ol-card { background: #fff; border: 1px solid #ece3d8; border-radius: 20px; padding: 30px; }
.ol-card-icon { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 14px; background: #fbf8f4; border: 1px solid #ece3d8; font-family: var(--font-instrument-serif), Georgia, serif; font-size: 24px; color: #d41d0d; }
.ol-card-title { margin: 22px 0 8px; font-size: 20px; font-weight: 700; color: #2a1c10; letter-spacing: -0.01em; }
.ol-card-body { margin: 0; font-size: 15px; line-height: 1.55; color: #6b5136; }

/* Como funciona */
.ol-como { background: #2a1c10; color: #fbf8f4; padding: clamp(80px, 12vw, 150px) 32px; }
.ol-como-inner { max-width: 1180px; margin: 0 auto; }
.ol-como .ol-head { margin-bottom: 64px; }
.ol-steps { max-width: 560px; margin: 0 auto; }
.ol-step-row { display: flex; }
.ol-step-group { display: flex; align-items: center; gap: 16px; width: 340px; max-width: 100%; }
.ol-step-node { flex: none; width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-instrument-serif), Georgia, serif; font-size: 22px; background: rgba(245,180,0,.14); color: #f5b400; border: 1px solid rgba(245,180,0,.4); }
.ol-step-node.is-last { background: #f5b400; color: #2a1c10; border-color: #f5b400; }
.ol-step-title { margin: 0 0 5px; font-size: 17px; font-weight: 700; color: #fbf8f4; letter-spacing: -0.01em; }
.ol-step-body { margin: 0; font-size: 13.5px; line-height: 1.5; color: rgba(251,248,244,.66); }
.ol-connector { width: 100%; height: 52px; display: block; overflow: visible; }

/* Planos */
.ol-electric-defs { position: absolute; width: 0; height: 0; }
.ol-grid-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 22px; align-items: stretch; }
.ol-plan { position: relative; display: flex; flex-direction: column; border-radius: 24px; padding: 38px 30px; background: #fff; border: 1px solid #ece3d8; }
.ol-plan.is-hl { background: #2a1c10; border: none; box-shadow: 0 24px 60px rgba(42,28,16,.28); }
.ol-plan-bgglow { position: absolute; inset: -6px; border-radius: 28px; filter: blur(26px); opacity: .35; background: radial-gradient(circle, rgba(245,180,0,.55), transparent 70%); z-index: 0; }
.ol-plan-glow2 { position: absolute; inset: 0; border-radius: 24px; border: 2px solid #f5b400; box-sizing: border-box; filter: blur(5px); opacity: .55; box-shadow: 0 0 24px rgba(245,180,0,.45); z-index: 1; }
.ol-plan-glow1 { position: absolute; inset: 0; border-radius: 24px; border: 2px solid #f5b400; box-sizing: border-box; filter: blur(1.5px); opacity: .65; z-index: 2; }
.ol-plan-stroke { position: absolute; inset: 0; border-radius: 24px; border: 2px solid #f5b400; box-sizing: border-box; filter: url(#ol-electric); z-index: 3; }
.ol-plan-name { position: relative; z-index: 4; margin: 0; font-family: var(--font-instrument-serif), Georgia, serif; font-weight: 400; font-size: 40px; letter-spacing: -0.01em; color: #2a1c10; }
.ol-plan.is-hl .ol-plan-name { color: #f5b400; }
.ol-plan-tagline { position: relative; z-index: 4; margin: 8px 0 22px; font-size: 14px; font-weight: 600; color: #6b5136; }
.ol-plan.is-hl .ol-plan-tagline { color: rgba(251,248,244,.72); }
.ol-plan-feats { position: relative; z-index: 4; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 13px; }
.ol-plan-feat { display: flex; align-items: flex-start; gap: 11px; font-size: 15px; line-height: 1.45; color: #2a1c10; }
.ol-plan.is-hl .ol-plan-feat { color: rgba(251,248,244,.9); }
.ol-plan-check { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: rgba(212,29,13,.1); color: #d41d0d; font-size: 11px; font-weight: 700; margin-top: 1px; }
.ol-plan.is-hl .ol-plan-check { background: rgba(245,180,0,.16); color: #f5b400; }

/* Contato */
.ol-contato { background: #fff; border-top: 1px solid #ece3d8; padding: clamp(80px, 12vw, 150px) 32px; }
.ol-contato-head { max-width: 820px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 26px; }
.ol-contato-sub { margin: 0; max-width: 520px; font-size: 17px; line-height: 1.5; color: #6b5136; }
.ol-contato-mail { font-family: ui-monospace, monospace; font-size: 14px; color: #6b5136; letter-spacing: .02em; }
.ol-contato-mail:hover { color: #d41d0d; }
.ol-footer { max-width: 1180px; margin: clamp(70px, 10vw, 110px) auto 0; padding-top: 34px; border-top: 1px solid #ece3d8; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.ol-footer-brand { font-family: var(--font-instrument-serif), Georgia, serif; font-size: 26px; color: #2a1c10; }
.ol-amber-dot { color: #d41d0d; }
.ol-footer-links { display: flex; gap: 18px; }
.ol-footer-links a { font-size: 13px; color: #6b5136; }
.ol-footer-links a:hover { color: #d41d0d; }
.ol-footer-copy { font-size: 13px; color: #6b5136; }

@media (prefers-reduced-motion: reduce) {
  .ol-anim { animation: none !important; }
  .ol-reveal { transition: none !important; }
}
`;
