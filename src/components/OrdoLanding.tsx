"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DiagnosticForm } from "./DiagnosticForm";

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
  ["01", "Mais ritmo no salão", "O cliente pede pelo próprio celular e o pedido chega direto à operação, sem depender de uma ida extra à mesa."],
  ["02", "Menos pressão na equipe", "Nos horários de pico, a equipe deixa de correr atrás de cada pedido e consegue focar em servir bem."],
  ["03", "Sem app pra baixar", "Só a câmera do celular. Escaneou, abriu, pediu. A experiência começa na hora."],
  ["04", "Cardápio sempre atual", "Mude preços e itens em um clique. Esgotou? O produto deixa de aparecer para o cliente."],
  ["05", "Mais clareza para decidir", "Veja o que vende, quando o salão acelera e onde sua operação pode recuperar margem."],
] as const;

const SEGMENTOS = [
  ["Restaurantes grandes", "A demanda já existe. O gargalo é a velocidade.", "Para salões cheios que precisam receber mais pedidos sem transformar cada pico em uma corrida da equipe."],
  ["Restaurantes médios e pequenos", "A folha pesa. Cada contratação precisa se pagar.", "Para operações que precisam fazer mais com a equipe atual e proteger o lucro antes de contratar de novo."],
] as const;

const METRICAS = [
  ["Tempo até o pedido", "Quantos minutos passam entre o cliente sentar e o pedido chegar à cozinha?"],
  ["Pedidos por hora", "Quantos pedidos sua equipe consegue absorver no pico sem criar fila?"],
  ["Equipe sobre faturamento", "Quanto da receita é consumido por salários e encargos?"],
  ["Tempo de fechamento", "Quanto tempo a equipe gasta para resolver a conta e liberar a mesa?"],
] as const;

const IMPACTO = [
  ["Pedido", "Garçom anota e leva", "Cliente envia; a cozinha recebe em tempo real", "menos retrabalho"],
  ["Pico", "A equipe corre para absorver a fila", "O cliente inicia o pedido sem esperar", "mais capacidade"],
  ["Contratação", "Mais gente para dar conta do movimento", "A equipe atual foca em servir e produzir", "folha mais protegida"],
  ["Gestão", "Decisão baseada no que parece estar acontecendo", "Dados de pedidos, ritmo e vendas em um só lugar", "mais clareza"],
] as const;

const PASSOS = [
  ["1", "Cliente escaneia o QR Code", "Aponta a câmera do celular para o QR da mesa. Sem baixar nada, o cardápio abre na hora."],
  ["2", "Faz o pedido pelo próprio aparelho", "Escolhe os itens, extras e quantidades sem esperar um atendente chegar à mesa."],
  ["3", "Pedido enviado para a cozinha", "O pedido cai na cozinha em tempo real e a equipe começa a produção mais rápido."],
  ["4", "Pedido pronto — cliente recebe atualizações", "O status muda em tempo real: em preparo, pronto, a caminho."],
  ["5", "Pedido entregue ao cliente", "A equipe foca em servir. O pagamento continua sendo feito na mesa, com o atendente."],
] as const;

const PLANOS = [
  {
    name: "Basic",
    tagline: "O essencial para começar hoje.",
    highlight: false,
    feats: [
      "Cardápio digital por QR code",
      "Pedido em tempo real na cozinha",
      "Pagamento manual na mesa",
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

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="ol-root" ref={rootRef}>
      <style>{CSS}</style>

      {/* ===== Sidebar de navegação ===== */}
      <nav className="ol-sidebar" aria-label="Seções">
        <div className="ol-sidebar-inner">
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

      {/* ===== Hero fixo ===== */}
      <section id="inicio" className="ol-hero">
        <div className="ol-hero-content">
          <div className="ol-badge">
            <span className="ol-badge-dot" />
            <span className="ol-badge-txt">Para donos de restaurantes</span>
          </div>
          <h1 className="ol-hero-title">
            Seu restaurante trabalhando com
            <br />
            <span className="ol-amber">menos equipe</span> e você lucrando mais
          </h1>
          <p className="ol-hero-sub">
            O único sistema que diminui o trabalho e aumenta a demanda —
            colocando mais ritmo no salão e mais lucro no caixa.
          </p>
          <div className="ol-hero-ctas">
            <a href="#contato" onClick={scrollTo("contato")} className="ol-cta-primary">
              Fazer diagnóstico grátis<span className="ol-arrow">→</span>
            </a>
            <a href="#como" onClick={scrollTo("como")} className="ol-cta-ghost">
              Ver como funciona
            </a>
          </div>
        </div>

        <div className="ol-hero-scroll">
          <span className="ol-hero-scroll-txt">deslize para ver</span>
          <span className="ol-hero-scroll-arrow">↓</span>
        </div>
      </section>

      {/* ===== Diferenciais ===== */}
      <section id="diferenciais" className="ol-sec">
        <div className="ol-reveal ol-head">
          <span className="ol-eyebrow ol-eyebrow-red">Diferenciais</span>
          <h2 className="ol-h2">
            Mais pedidos no mesmo ritmo. Menos correria para a equipe. Mais
            lucro para o dono.
          </h2>
        </div>
        <div className="ol-segment-grid">
          {SEGMENTOS.map(([title, heading, body]) => (
            <article key={title} className="ol-segment">
              <span className="ol-segment-label">{title}</span>
              <h3>{heading}</h3>
              <p>{body}</p>
            </article>
          ))}
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
        <div className="ol-metrics">
          <div className="ol-metrics-head">
            <span className="ol-eyebrow ol-eyebrow-red">O diagnóstico olha para</span>
            <h3>Os números que mostram onde o seu lucro está escapando.</h3>
          </div>
          <div className="ol-metrics-list">
            {METRICAS.map(([title, body], i) => (
              <div key={title} className="ol-metric">
                <span className="ol-metric-number">0{i + 1}</span>
                <div><strong>{title}</strong><p>{body}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="ol-impact">
          <div className="ol-metrics-head">
            <span className="ol-eyebrow ol-eyebrow-red">A mudança na prática</span>
            <h3>Menos esforço no caminho entre o cliente e o caixa.</h3>
          </div>
          <div className="ol-impact-wrap">
            <table className="ol-impact-table">
              <thead>
                <tr><th>Etapa</th><th>Hoje</th><th>Com Ordo</th><th>O que muda</th></tr>
              </thead>
              <tbody>
                {IMPACTO.map(([step, today, withOrdo, change]) => (
                  <tr key={step}><th scope="row">{step}</th><td>{today}</td><td>{withOrdo}</td><td>{change}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ol-table-note">A tabela mostra a lógica operacional do produto. O diagnóstico mede o impacto real no seu restaurante.</p>
        </div>
      </section>

      {/* ===== Como funciona ===== */}
      <section id="como" className="ol-como">
        <div className="ol-como-inner">
          <div className="ol-reveal ol-head">
            <span className="ol-eyebrow ol-eyebrow-amber">Como funciona</span>
            <h2 className="ol-h2 ol-h2-light">
              O cliente pede. A equipe produz. Você acompanha o ritmo.
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
        <div className="ol-contato-layout">
          <div className="ol-reveal ol-contato-head">
            <span className="ol-eyebrow ol-eyebrow-red">Diagnóstico Ordo</span>
            <h2 className="ol-h2 ol-h2-big">
              Seu próximo ganho pode estar na operação.
            </h2>
            <p className="ol-contato-sub">
              Conte como seu restaurante funciona hoje. Vamos identificar onde
              reduzir esforço, acelerar o atendimento e proteger sua margem.
            </p>
          </div>
          <DiagnosticForm />
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
            {`© ${new Date().getFullYear()} Otium · Operação à mesa por QR code`}
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
.ol-hero { position: relative; height: 100dvh; min-height: 620px; width: 100%; background: #17100c; background-image: linear-gradient(118deg, #17100c 0%, #2a1c10 52%, #351b14 100%); overflow: hidden; display: flex; align-items: center; justify-content: flex-start; }
.ol-hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(23,16,12,.18), rgba(23,16,12,.04) 65%, rgba(23,16,12,.28)); pointer-events: none; }
.ol-hero-content { position: relative; z-index: 10; max-width: 900px; padding: 0 clamp(32px, 13vw, 220px); text-align: left; display: flex; flex-direction: column; align-items: flex-start; gap: 30px; }
.ol-badge { display: flex; align-items: center; gap: 10px; padding: 7px 16px; border: 1px solid rgba(255,255,255,.28); border-radius: 999px; }
.ol-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #f5b400; box-shadow: 0 0 12px #f5b400; }
.ol-badge-txt { font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.82); }
.ol-hero-title { margin: 0; font-family: var(--font-instrument-serif), Georgia, serif; font-weight: 400; font-size: clamp(44px, 8.4vw, 108px); line-height: 0.98; letter-spacing: -0.01em; color: #ffffff; text-wrap: balance; text-shadow: 0 4px 40px rgba(0,0,0,.5); }
.ol-hero-sub { margin: 0; max-width: 560px; font-size: clamp(15px, 2vw, 19px); line-height: 1.5; color: rgba(255,255,255,.78); }
.ol-hero-ctas { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: flex-start; }
.ol-arrow { font-size: 20px; line-height: 1; }
.ol-cta-primary { display: inline-flex; align-items: center; gap: 10px; background: #d41d0d; color: #fff; font-weight: 700; font-size: 16px; letter-spacing: .04em; padding: 17px 36px; border-radius: 999px; box-shadow: 0 12px 34px rgba(212,29,13,.45); transition: transform .18s ease, background .18s ease, box-shadow .18s ease; }
.ol-cta-primary:hover { background: #b01808; color: #fff; transform: translateY(-2px); box-shadow: 0 16px 40px rgba(212,29,13,.55); }
.ol-cta-ghost { display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,.9); font-weight: 600; font-size: 15px; padding: 16px 8px; border-bottom: 1px solid rgba(255,255,255,.35); }
.ol-cta-ghost:hover { color: #fff; border-color: #fff; }
.ol-hero-scroll { position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%); z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 6px; }
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

/* Segmentação e diagnóstico: o dono se reconhece antes de ver o produto. */
.ol-segment-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-bottom: 44px; }
.ol-segment { padding: 28px 30px; border-radius: 20px; background: #2a1c10; color: #fbf8f4; }
.ol-segment-label { display: block; margin-bottom: 24px; color: #f5b400; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.ol-segment h3 { margin: 0 0 10px; font-size: clamp(20px, 2.4vw, 28px); line-height: 1.12; letter-spacing: -.02em; }
.ol-segment p { margin: 0; color: rgba(251,248,244,.68); font-size: 15px; line-height: 1.55; }
.ol-metrics { display: grid; grid-template-columns: minmax(220px, .8fr) minmax(0, 1.2fr); gap: 56px; margin-top: 76px; padding-top: 34px; border-top: 1px solid #ece3d8; }
.ol-metrics-head h3 { margin: 14px 0 0; font-family: var(--font-instrument-serif), Georgia, serif; font-size: clamp(28px, 4vw, 44px); font-weight: 400; line-height: 1.05; }
.ol-metrics-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 22px; }
.ol-metric { display: flex; align-items: flex-start; gap: 13px; }
.ol-metric-number { color: #d41d0d; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; letter-spacing: .1em; }
.ol-metric strong { display: block; font-size: 16px; }
.ol-metric p { margin: 6px 0 0; color: #6b5136; font-size: 13px; line-height: 1.45; }
.ol-impact { margin-top: 76px; padding-top: 34px; border-top: 1px solid #ece3d8; }
.ol-impact-wrap { margin-top: 28px; overflow-x: auto; border: 1px solid #ece3d8; border-radius: 18px; background: #fff; }
.ol-impact-table { width: 100%; min-width: 760px; border-collapse: collapse; text-align: left; }
.ol-impact-table th, .ol-impact-table td { padding: 17px 18px; border-bottom: 1px solid #ece3d8; vertical-align: top; font-size: 13px; line-height: 1.45; }
.ol-impact-table thead th { background: #fbf8f4; color: #806b57; font-family: ui-monospace, monospace; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.ol-impact-table tbody tr:last-child th, .ol-impact-table tbody tr:last-child td { border-bottom: 0; }
.ol-impact-table tbody th { width: 13%; color: #d41d0d; font-size: 14px; }
.ol-impact-table tbody td:nth-child(3) { color: #2a1c10; font-weight: 600; }
.ol-impact-table tbody td:last-child { color: #d41d0d; font-weight: 700; }
.ol-table-note { margin: 12px 0 0; color: #806b57; font-size: 11px; line-height: 1.45; }

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
.ol-contato-layout { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, .78fr) minmax(460px, 1.22fr); gap: clamp(42px, 7vw, 100px); align-items: start; }
.ol-contato-head { max-width: 520px; display: flex; flex-direction: column; align-items: flex-start; gap: 26px; }
.ol-contato-sub { margin: 0; max-width: 520px; font-size: 17px; line-height: 1.5; color: #6b5136; }
.od-form { display: flex; flex-direction: column; gap: 18px; padding: 30px; border: 1px solid #ece3d8; border-radius: 24px; background: #fbf8f4; }
.od-form-heading { margin-bottom: 4px; }
.od-form-kicker { color: #d41d0d; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.od-form-progress { display: flex; align-items: center; gap: 12px; margin-top: 16px; color: #806b57; font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: .04em; }
.od-form-progress-track { flex: 1; height: 4px; overflow: hidden; border-radius: 999px; background: #eadfd4; }
.od-form-progress-track span { display: block; height: 100%; border-radius: inherit; background: #d41d0d; transition: width .25s ease; }
.od-form-heading h3 { margin: 12px 0 8px; color: #2a1c10; font-size: clamp(24px, 3vw, 34px); line-height: 1.08; letter-spacing: -.03em; }
.od-form-heading p { margin: 0; color: #6b5136; font-size: 14px; line-height: 1.5; }
.od-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.od-form label { display: flex; flex-direction: column; gap: 7px; color: #2a1c10; font-size: 12px; font-weight: 700; }
.od-input { width: 100%; min-height: 46px; border: 1px solid #d9cabb; border-radius: 10px; background: #fff; padding: 0 13px; color: #2a1c10; font: inherit; font-size: 14px; font-weight: 500; outline: none; }
.od-input::placeholder { color: #9b856e; }
.od-input:focus { border-color: #d41d0d; box-shadow: 0 0 0 3px rgba(212,29,13,.12); }
.od-carousel { display: flex; min-height: 276px; flex-direction: column; justify-content: center; }
.od-slide { display: flex; flex-direction: column; gap: 24px; }
.od-slide-question { display: flex; align-items: flex-start; gap: 14px; }
.od-slide-number { padding-top: 6px; color: #d41d0d; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; letter-spacing: .1em; }
.od-slide-question h4 { margin: 0; color: #2a1c10; font-size: clamp(24px, 3vw, 34px); line-height: 1.08; letter-spacing: -.03em; }
.od-slide-question p { margin: 8px 0 0; color: #806b57; font-size: 13px; line-height: 1.4; }
.od-option-list { display: flex; flex-direction: column; gap: 10px; }
.od-option { display: flex; align-items: center; gap: 12px; min-height: 52px; border: 1px solid #d9cabb; border-radius: 14px; background: #fff; padding: 10px 13px; color: #2a1c10; cursor: pointer; font-size: 14px; font-weight: 600; transition: border-color .2s ease, background .2s ease, transform .2s ease; }
.od-option:hover { border-color: #d41d0d; transform: translateX(2px); }
.od-option:has(input:checked) { border-color: #d41d0d; background: #fff4f1; }
.od-option input { width: 17px; height: 17px; accent-color: #d41d0d; }
.od-option span { flex: 1; }
.od-option i { color: #d41d0d; font-size: 18px; font-style: normal; }
.od-form-actions { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.od-form-actions .od-form-submit { flex: 0 1 260px; }
.od-form-back { min-height: 52px; border: 1px solid #d9cabb; border-radius: 999px; background: transparent; padding: 0 20px; color: #6b5136; cursor: pointer; font: inherit; font-size: 14px; font-weight: 700; }
.od-form-back:hover { border-color: #d41d0d; color: #d41d0d; }
.od-form-submit { display: inline-flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 52px; border: 0; border-radius: 999px; background: #d41d0d; padding: 0 20px 0 24px; color: #fff; cursor: pointer; font: inherit; font-size: 15px; font-weight: 700; transition: background .2s ease, transform .2s ease; }
.od-form-submit:hover { background: #b01808; transform: translateY(-1px); }
.od-form-submit:disabled { cursor: wait; opacity: .65; }
.od-form-submit span { font-size: 21px; }
.od-form-note { margin: -5px 0 0; color: #806b57; font-size: 11px; line-height: 1.4; text-align: center; }
.od-form-error { margin: 0; border-radius: 10px; background: #fff0ed; padding: 10px 12px; color: #9b1c10; font-size: 13px; line-height: 1.4; }
.od-form-success { display: flex; min-height: 360px; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border: 1px solid #d8e8d9; border-radius: 24px; background: #f4fbf4; padding: 30px; text-align: center; }
.od-success-mark { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 50%; background: #2f7d42; color: #fff; font-size: 22px; }
.od-form-success h3 { margin: 0; color: #205b2d; font-size: 24px; }
.od-form-success p { margin: 0; color: #4d6f54; font-size: 14px; }
.od-honeypot { position: absolute; left: -10000px; width: 1px; height: 1px; opacity: 0; }
.ol-footer { max-width: 1180px; margin: clamp(70px, 10vw, 110px) auto 0; padding-top: 34px; border-top: 1px solid #ece3d8; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.ol-footer-brand { font-family: var(--font-instrument-serif), Georgia, serif; font-size: 26px; color: #2a1c10; }
.ol-amber-dot { color: #d41d0d; }
.ol-footer-links { display: flex; gap: 18px; }
.ol-footer-links a { font-size: 13px; color: #6b5136; }
.ol-footer-links a:hover { color: #d41d0d; }
.ol-footer-copy { font-size: 13px; color: #6b5136; }

@media (prefers-reduced-motion: reduce) {
  .ol-reveal { transition: none !important; }
}

@media (max-width: 760px) {
  .ol-hero { min-height: 680px; }
  .ol-hero-content { padding: 0 24px; gap: 24px; }
  .ol-hero-title { font-size: clamp(42px, 12vw, 68px); }
  .ol-hero-sub { font-size: 16px; }
  .ol-segment-grid, .ol-metrics, .ol-contato-layout { grid-template-columns: 1fr; }
  .ol-metrics { gap: 30px; }
  .ol-contato-layout { gap: 38px; }
  .od-form { padding: 22px 18px; }
}

@media (max-width: 480px) {
  .ol-sec, .ol-como, .ol-contato { padding-left: 20px; padding-right: 20px; }
  .od-form-grid, .ol-metrics-list { grid-template-columns: 1fr; }
  .od-form-actions .od-form-submit { flex: 1; }
  .od-slide-question h4 { font-size: 26px; }
  .ol-hero-ctas { align-items: stretch; flex-direction: column; width: 100%; }
  .ol-cta-primary, .ol-cta-ghost { justify-content: center; }
}
`;
