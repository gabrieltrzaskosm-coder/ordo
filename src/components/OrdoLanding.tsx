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
  { id: "resultados", label: "Resultados" },
  { id: "como", label: "Como Funciona" },
  { id: "planos", label: "Planos" },
  { id: "faq", label: "FAQ" },
  { id: "contato", label: "Contato" },
] as const;

const SEGMENTOS = [
  ["Restaurantes grandes", "A demanda já existe. O gargalo é a velocidade.", "Para salões cheios que precisam receber mais pedidos sem transformar cada pico em uma corrida da equipe."],
  ["Restaurantes médios e pequenos", "A folha pesa. Cada contratação precisa se pagar.", "Para operações que precisam fazer mais com equipes menores."],
] as const;

const SHOWCASE = [
  { label: "Gestão", eyebrow: "Visão do negócio", type: "gestao" },
  { label: "Atendimento", eyebrow: "Ritmo do salão", type: "atendimento" },
  { label: "Cozinha", eyebrow: "Produção em tempo real", type: "cozinha" },
  { label: "Cliente", eyebrow: "Pedido sem espera", type: "cliente" },
] as const;

const RESULTADOS = [
  ["Mais ritmo", "O cliente inicia o pedido sem esperar um atendente chegar à mesa."],
  ["Menos retrabalho", "A cozinha recebe o pedido com as informações certas e a equipe sabe o próximo passo."],
  ["Mais mesas", "Uma equipe mais organizada consegue absorver melhor os horários de pico."],
  ["Equipe mais enxuta", "As pessoas deixam de correr atrás de tarefas repetitivas e focam em servir e produzir."],
  ["Mais clareza", "Dados de pedidos, vendas e horários de pico ajudam o dono a decidir com mais segurança."],
] as const;

type ShowcaseType = (typeof SHOWCASE)[number]["type"];

function ShowcaseVisual({ type }: { type: ShowcaseType }) {
  if (type === "cliente") {
    return (
      <div className="ol-preview-device ol-preview-device-mobile">
        <div className="ol-preview-mobile-top"><span>Trattoria</span><span>⌕</span></div>
        <div className="ol-preview-mobile-hero">
          <span>Cardápio da mesa 12</span>
          <strong>Escolha sem esperar.</strong>
        </div>
        <div className="ol-preview-mobile-tabs"><span className="is-active">Mais pedidos</span><span>Entradas</span><span>Principais</span></div>
        <div className="ol-preview-menu-item"><span className="ol-preview-food-art food-art-red" /><div><strong>Burger Ordo</strong><small>Blend 180g, cheddar e picles</small><b>R$ 38,90</b></div><i>+</i></div>
        <div className="ol-preview-menu-item"><span className="ol-preview-food-art food-art-green" /><div><strong>Risoto de cogumelos</strong><small>Arbóreo, funghi e parmesão</small><b>R$ 42,90</b></div><i>+</i></div>
        <div className="ol-preview-order-bar"><span>2 itens</span><strong>Ver pedido · R$ 81,80</strong></div>
      </div>
    );
  }

  if (type === "cozinha") {
    return (
      <div className="ol-preview-device ol-preview-device-wide">
        <div className="ol-preview-appbar"><strong>Ordo<span>.</span></strong><b>Cozinha</b><small>Trattoria Vermelha · agora</small></div>
        <div className="ol-preview-kitchen-grid">
          <div className="ol-preview-column"><header><span>NOVOS</span><b>02</b></header><div className="ol-preview-ticket is-new"><strong>Mesa 12</strong><small>João · há 40s</small><p>2× Burger Duplo<br />1× Batata rústica</p><button>Iniciar preparo</button></div><div className="ol-preview-ticket is-new"><strong>Mesa 07</strong><small>Marina · há 1m</small><p>1× Risoto Funghi</p></div></div>
          <div className="ol-preview-column"><header><span>EM PREPARO</span><b>02</b></header><div className="ol-preview-ticket is-prep"><strong>Mesa 03</strong><small>Pedro · há 2m</small><p>1× Ribeye 400g<br />1× Caesar salad</p><button>Marcar pronto</button></div><div className="ol-preview-ticket is-prep"><strong>Mesa 18</strong><small>há 4m</small><p>2× Salmão grelhado</p></div></div>
          <div className="ol-preview-column"><header><span>PRONTOS</span><b>01</b></header><div className="ol-preview-ticket is-ready"><strong>Mesa 09</strong><small>Rafa · pronto</small><p>1× Poke bowl</p><button>Entregar</button></div></div>
        </div>
      </div>
    );
  }

  if (type === "atendimento") {
    return (
      <div className="ol-preview-device ol-preview-device-wide">
        <div className="ol-preview-appbar"><strong>Ordo<span>.</span></strong><b>Atendimento</b><small>18 mesas · 6 abertas</small></div>
        <div className="ol-preview-service-layout"><div className="ol-preview-table-grid">{["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((table, index) => <span key={table} className={index % 4 === 0 ? "is-waiting" : index % 3 === 0 ? "is-open" : "is-free"}>Mesa {table}<small>{index % 4 === 0 ? "chamou" : index % 3 === 0 ? "3 itens" : "livre"}</small></span>)}</div><div className="ol-preview-order-panel"><small>Pedido selecionado</small><h3>Mesa 12</h3><p>2× Burger Duplo</p><p>1× Batata rústica</p><hr /><strong>R$ 84,00</strong><button>Ver pedido</button></div></div>
      </div>
    );
  }

  return (
    <div className="ol-preview-device ol-preview-device-wide">
      <div className="ol-preview-appbar"><strong>Ordo<span>.</span></strong><b>Gestão</b><small>Trattoria Vermelha · Hoje</small></div>
      <div className="ol-preview-management"><div className="ol-preview-management-head"><div><small>Visão geral</small><h3>O ritmo do seu restaurante</h3></div><button>Hoje⌄</button></div><div className="ol-preview-stat-grid"><div><small>Pedidos hoje</small><strong>23</strong><b>+18% vs. ontem</b></div><div><small>Valor pedido</small><strong>R$ 864</strong><b>+12% vs. ontem</b></div><div><small>Ticket médio</small><strong>R$ 37,56</strong><b>+8% vs. ontem</b></div></div><div className="ol-preview-chart"><div><small>Movimento esperado por dia</small><strong>O pico começa às 19h</strong></div><div className="ol-preview-bars">{[32, 48, 42, 64, 78, 92, 58].map((height, index) => <span key={index} style={{ height: `${height}%` }} className={index === 5 ? "is-highlight" : ""} />)}</div><div className="ol-preview-chart-labels"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div></div></div>
    </div>
  );
}

const METRICAS = [
  ["7 min até o primeiro atendimento", "Em uma operação sem ritmo, um cliente pode esperar cerca de 7 minutos para ser atendido em horas de pico."],
  ["12 pedidos por hora no pico", "O diagnóstico mede quantos pedidos a equipe consegue absorver sem criar fila, retrabalho ou perda de mesas."],
  ["36,5% da receita em equipe", "Em restaurantes de serviço completo, salários e benefícios representaram uma mediana de 36,5% das vendas em 2024."],
  ["5% de margem antes de impostos", "Em uma operação típica, a margem é estreita. Ganhar velocidade e reduzir erros faz diferença no caixa."],
] as const;

const IMPACTO = [
  ["Pedido", "Garçom anota e leva", "Cliente envia; a cozinha recebe em tempo real, garçom apenas leva até a mesa", "Funções bem definidas"],
  ["Pico", "A equipe corre para absorver a fila", "O cliente inicia o pedido sem esperar", "mais capacidade"],
  ["Equipe", "Com mais movimento, mais equipe, menores os lucros", "Equipes mínimas dão conta da demanda", "Aumento de lucros"],
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

const FAQ = [
  [
    "Como o Ordo funciona no restaurante?",
    "O cliente escaneia o QR Code da mesa, acessa o cardápio pelo próprio celular e envia o pedido. A cozinha recebe as informações em tempo real e a equipe acompanha o andamento da operação.",
  ],
  [
    "O cliente precisa baixar algum aplicativo?",
    "Não. Basta apontar a câmera do celular para o QR Code da mesa. O cardápio abre no navegador, sem download e sem cadastro em aplicativo.",
  ],
  [
    "O pedido vai direto para a cozinha?",
    "Sim. O pedido é enviado para a operação em tempo real, reduzindo o caminho entre a escolha do cliente e o início da produção.",
  ],
  [
    "O Ordo substitui os garçons?",
    "Não. O Ordo organiza as funções: o cliente envia o pedido, a cozinha recebe as informações e o garçom concentra seu trabalho em servir, acompanhar e levar o pedido até a mesa.",
  ],
  [
    "O Ordo serve para restaurantes pequenos?",
    "Sim. O sistema foi pensado para operações de diferentes tamanhos, especialmente restaurantes que precisam fazer mais com a equipe atual e proteger a margem antes de contratar novamente.",
  ],
  [
    "É possível atender mais mesas com uma equipe menor?",
    "Esse é um dos objetivos da operação: tirar da equipe tarefas repetitivas de anotação e deslocamento para que equipes mínimas consigam absorver mais demanda. O impacto depende do cenário de cada restaurante.",
  ],
  [
    "O Ordo cobra comissão sobre os pedidos?",
    "Não. No Ordo, o restaurante recebe 100% da venda. Os planos são definidos pela estrutura e pelos recursos que fazem sentido para o seu negócio.",
  ],
  [
    "Consigo acompanhar as vendas e os horários de pico?",
    "Sim. Nos planos com inteligência de vendas, você acompanha dados como vendas, pedidos, ticket médio, horários de pico, itens mais vendidos e tendências para decidir com mais clareza.",
  ],
  [
    "Posso atualizar preços e itens do cardápio?",
    "Sim. O cardápio pode ser atualizado de forma centralizada, incluindo preços, itens e disponibilidade. Quando um produto esgota, ele pode deixar de aparecer para o cliente.",
  ],
  [
    "Como saber qual plano é melhor para o meu restaurante?",
    "O diagnóstico considera o tamanho da operação, o volume de pedidos, o peso da equipe na receita e os seus objetivos. A partir dessas respostas, nossa equipe orienta o plano mais adequado.",
  ],
] as const;

const STEP_LTR = "M6 0 C6 42, 94 12, 94 56";
const STEP_RTL = "M94 0 C94 42, 6 12, 6 56";

export function OrdoLanding() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [resultsIndex, setResultsIndex] = useState(0);

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

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setShowcaseIndex((current) => (current + 1) % SHOWCASE.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  const moveShowcase = (direction: -1 | 1) => {
    setShowcaseIndex(
      (current) => (current + direction + SHOWCASE.length) % SHOWCASE.length
    );
  };

  const moveResults = (direction: -1 | 1) => {
    setResultsIndex(
      (current) => (current + direction + RESULTADOS.length) % RESULTADOS.length
    );
  };

  const visibleResults = [0, 1, 2].map((offset) => {
    const index = (resultsIndex + offset) % RESULTADOS.length;
    return { index, result: RESULTADOS[index] };
  });

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
            <p className="ol-metrics-note">Referências de operação para orientar o diagnóstico. A medição real considera os dados do seu restaurante.</p>
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
        <div className="ol-section-cta">
          <p>Quer descobrir onde o seu restaurante pode recuperar margem?</p>
          <a href="#contato" onClick={scrollTo("contato")} className="ol-cta-primary">
            Fazer diagnóstico grátis<span className="ol-arrow">→</span>
          </a>
        </div>
      </section>

      {/* ===== Preview dos hubs ===== */}
      <section className="ol-showcase" aria-labelledby="showcase-title">
        <div className="ol-showcase-inner">
          <div className="ol-showcase-copy">
            <span className="ol-eyebrow ol-eyebrow-red">Dentro do Ordo</span>
            <h2 id="showcase-title" className="ol-h2">
              Uma operação mais rápida em cada tela.
            </h2>
            <p>Do pedido do cliente à decisão do dono, cada hub organiza o próximo passo da equipe.</p>
            <a href="#contato" onClick={scrollTo("contato")} className="ol-cta-primary">
              Fazer diagnóstico grátis<span className="ol-arrow">→</span>
            </a>
          </div>
          <div className="ol-showcase-stage">
            <div className="ol-showcase-label"><span>{SHOWCASE[showcaseIndex].eyebrow}</span><strong>{SHOWCASE[showcaseIndex].label}</strong></div>
            <div className="ol-showcase-viewport" aria-live="polite">
              <ShowcaseVisual type={SHOWCASE[showcaseIndex].type} />
            </div>
            <div className="ol-showcase-controls">
              <button type="button" className="ol-showcase-arrow" onClick={() => moveShowcase(-1)} aria-label="Tela anterior">←</button>
              <div className="ol-showcase-dots" aria-label="Selecionar tela do sistema">
                {SHOWCASE.map((item, index) => (
                  <button type="button" key={item.type} className={index === showcaseIndex ? "is-active" : ""} onClick={() => setShowcaseIndex(index)} aria-label={`Mostrar hub ${item.label}`} aria-pressed={index === showcaseIndex} />
                ))}
              </div>
              <span className="ol-showcase-count">0{showcaseIndex + 1} / 0{SHOWCASE.length}</span>
              <button type="button" className="ol-showcase-arrow" onClick={() => moveShowcase(1)} aria-label="Próxima tela">→</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Resultados ===== */}
      <section id="resultados" className="ol-results" aria-labelledby="results-title">
        <div className="ol-results-inner">
          <div className="ol-results-head">
            <span className="ol-eyebrow ol-eyebrow-red">Resultados</span>
            <h2 id="results-title" className="ol-h2">O impacto que aparece na operação e chega no lucro.</h2>
            <p>O Ordo organiza o fluxo para que o restaurante ganhe velocidade sem depender de aumentar a equipe.</p>
          </div>
          <div className="ol-results-carousel">
            <div className="ol-results-track" aria-live="polite">
              {visibleResults.map(({ index, result: [title, body] }, offset) => (
                <article key={`${index}-${offset}`} className="ol-result-slide">
                  <div className="ol-result-card">
                    <span className="ol-result-number">0{index + 1}</span>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="ol-results-controls">
            <button type="button" className="ol-showcase-arrow" onClick={() => moveResults(-1)} aria-label="Resultado anterior">←</button>
            <div className="ol-showcase-dots" aria-label="Selecionar resultado">
              {RESULTADOS.map(([title], index) => (
                <button type="button" key={title} className={index === resultsIndex ? "is-active" : ""} onClick={() => setResultsIndex(index)} aria-label={`Mostrar resultado: ${title}`} aria-pressed={index === resultsIndex} />
              ))}
            </div>
            <span className="ol-showcase-count">0{resultsIndex + 1} / 0{RESULTADOS.length}</span>
            <button type="button" className="ol-showcase-arrow" onClick={() => moveResults(1)} aria-label="Próximo resultado">→</button>
          </div>
          <a href="#contato" onClick={scrollTo("contato")} className="ol-cta-primary">
            Fazer diagnóstico grátis<span className="ol-arrow">→</span>
          </a>
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
          <div className="ol-como-cta">
            <a href="#contato" onClick={scrollTo("contato")} className="ol-cta-primary">
              Fazer diagnóstico grátis<span className="ol-arrow">→</span>
            </a>
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
        <div className="ol-section-cta">
          <p>Veja qual plano acompanha o momento do seu restaurante.</p>
          <a href="#contato" onClick={scrollTo("contato")} className="ol-cta-primary">
            Fazer diagnóstico grátis<span className="ol-arrow">→</span>
          </a>
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

        {/* ===== FAQ ===== */}
        <section id="faq" className="ol-sec ol-faq-section">
          <div className="ol-reveal ol-head">
            <span className="ol-eyebrow ol-eyebrow-red">FAQ</span>
            <h2 className="ol-h2">
              As respostas para decidir se o Ordo faz sentido para o seu restaurante.
            </h2>
          </div>
          <div className="ol-faq" aria-label="Perguntas frequentes sobre o Ordo">
            {FAQ.map(([question, answer]) => (
              <details key={question} className="ol-faq-item">
                <summary className="ol-faq-question">{question}</summary>
                <p className="ol-faq-answer">{answer}</p>
              </details>
            ))}
          </div>
        </section>

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
.ol-hero { position: relative; min-height: 100dvh; width: 100%; background: #17100c; background-image: linear-gradient(118deg, #17100c 0%, #2a1c10 52%, #351b14 100%); overflow: hidden; display: flex; align-items: center; justify-content: center; }
.ol-hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(23,16,12,.18), rgba(23,16,12,.04) 65%, rgba(23,16,12,.28)); pointer-events: none; }
.ol-hero-content { position: relative; z-index: 10; width: min(100% - 48px, 1040px); padding: 104px 0 84px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 30px; }
.ol-hero-title { max-width: 1000px; margin: 0; font-family: var(--font-instrument-serif), Georgia, serif; font-weight: 400; font-size: clamp(44px, 8.4vw, 108px); line-height: 0.98; letter-spacing: -0.01em; color: #ffffff; text-wrap: balance; text-shadow: 0 4px 40px rgba(0,0,0,.5); }
.ol-hero-sub { margin: 0 auto; max-width: 560px; font-size: clamp(15px, 2vw, 19px); line-height: 1.5; color: rgba(255,255,255,.78); }
.ol-hero-ctas { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center; }
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
.ol-head { max-width: 820px; margin: 0 auto 56px; text-align: center; }
.ol-eyebrow { font-family: ui-monospace, monospace; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; font-weight: 600; }
.ol-eyebrow-red { color: #d41d0d; }
.ol-eyebrow-amber { color: #f5b400; }
.ol-h2 { margin: 16px 0 0; font-family: var(--font-instrument-serif), Georgia, serif; font-weight: 400; font-size: clamp(34px, 5.2vw, 60px); line-height: 1.04; letter-spacing: -0.01em; color: #2a1c10; text-wrap: balance; }
.ol-h2-light { color: #fbf8f4; }
.ol-h2-big { font-size: clamp(38px, 6vw, 74px); line-height: 1.0; }

/* Reveal */
.ol-reveal { opacity: 1; transform: none; transition: opacity .8s ease, transform .8s ease; }
.ol-reveal.is-in { opacity: 1; transform: none; }

/* Diferenciais cards */
.ol-grid-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.ol-card { background: #fff; border: 1px solid #ece3d8; border-radius: 20px; padding: 30px; text-align: center; }
.ol-card-icon { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 14px; background: #fbf8f4; border: 1px solid #ece3d8; font-family: var(--font-instrument-serif), Georgia, serif; font-size: 24px; color: #d41d0d; }
.ol-card-title { margin: 22px 0 8px; font-size: 20px; font-weight: 700; color: #2a1c10; letter-spacing: -0.01em; }
.ol-card-body { margin: 0; font-size: 15px; line-height: 1.55; color: #6b5136; }

/* Segmentação e diagnóstico: o dono se reconhece antes de ver o produto. */
.ol-segment-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-bottom: 44px; }
.ol-segment { padding: 28px 30px; border-radius: 20px; background: #2a1c10; color: #fbf8f4; text-align: center; }
.ol-segment-label { display: block; margin-bottom: 24px; color: #f5b400; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.ol-segment h3 { margin: 0 0 10px; font-size: clamp(20px, 2.4vw, 28px); line-height: 1.12; letter-spacing: -.02em; }
.ol-segment p { margin: 0; color: rgba(251,248,244,.68); font-size: 15px; line-height: 1.55; }
.ol-metrics { display: grid; grid-template-columns: minmax(220px, .8fr) minmax(0, 1.2fr); gap: 56px; margin-top: 76px; padding-top: 34px; border-top: 1px solid #ece3d8; }
.ol-metrics-head { text-align: center; }
.ol-metrics-head h3 { margin: 14px 0 0; font-family: var(--font-instrument-serif), Georgia, serif; font-size: clamp(28px, 4vw, 44px); font-weight: 400; line-height: 1.05; }
.ol-metrics-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 22px; }
.ol-metric { display: flex; align-items: flex-start; gap: 13px; }
.ol-metric-number { color: #d41d0d; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; letter-spacing: .1em; }
.ol-metric strong { display: block; font-size: 16px; }
.ol-metric p { margin: 6px 0 0; color: #6b5136; font-size: 13px; line-height: 1.45; }
.ol-metrics-note { grid-column: 1 / -1; margin: -4px 0 0; color: #806b57; font-size: 11px; line-height: 1.45; }
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
.ol-section-cta { display: flex; flex-direction: column; align-items: center; gap: 16px; margin: 64px auto 0; text-align: center; }
.ol-section-cta p { margin: 0; color: #6b5136; font-size: 15px; }

/* Previews dos hubs */
.ol-showcase { border-top: 1px solid #ece3d8; border-bottom: 1px solid #ece3d8; background: #fff; padding: clamp(74px, 10vw, 126px) 32px; }
.ol-showcase-inner { display: grid; grid-template-columns: minmax(260px, .72fr) minmax(0, 1.28fr); gap: clamp(42px, 8vw, 112px); max-width: 1180px; margin: 0 auto; align-items: center; }
.ol-showcase-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 24px; }
.ol-showcase-copy .ol-h2 { margin-top: 0; }
.ol-showcase-copy p { max-width: 390px; margin: 0; color: #6b5136; font-size: 17px; line-height: 1.55; }
.ol-showcase-stage { min-width: 0; }
.ol-showcase-label { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; margin: 0 4px 12px; }
.ol-showcase-label span { color: #806b57; font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
.ol-showcase-label strong { color: #d41d0d; font-size: 14px; }
.ol-showcase-viewport { position: relative; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 24px; background: #2a1c10; padding: 14px; box-shadow: 0 20px 50px rgba(42,28,16,.18); }
.ol-preview-device { width: 100%; height: 100%; overflow: hidden; border: 1px solid #e7ddd2; border-radius: 15px; background: #fbf8f4; color: #2a1c10; font-family: var(--font-manrope), ui-sans-serif, system-ui, sans-serif; }
.ol-preview-device-wide { padding: 0; }
.ol-preview-appbar { display: flex; align-items: center; gap: 16px; height: 48px; border-bottom: 1px solid #e7ddd2; background: #fff; padding: 0 18px; }
.ol-preview-appbar strong { font-family: var(--font-instrument-serif), Georgia, serif; font-size: 23px; font-weight: 400; }
.ol-preview-appbar strong span { color: #d41d0d; }
.ol-preview-appbar b { font-size: 12px; }
.ol-preview-appbar small { margin-left: auto; color: #806b57; font-size: 10px; }
.ol-preview-management { padding: 22px; }
.ol-preview-management-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.ol-preview-management-head small, .ol-preview-chart small { display: block; color: #806b57; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; }
.ol-preview-management h3 { margin: 5px 0 0; font-family: var(--font-instrument-serif), Georgia, serif; font-size: 24px; font-weight: 400; }
.ol-preview-management button, .ol-preview-order-panel button { border: 1px solid #d9cabb; border-radius: 999px; background: #fff; padding: 7px 12px; color: #6b5136; font: inherit; font-size: 10px; }
.ol-preview-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
.ol-preview-stat-grid > div { border: 1px solid #e7ddd2; border-radius: 10px; background: #fff; padding: 13px; }
.ol-preview-stat-grid small { display: block; color: #806b57; font-size: 9px; }
.ol-preview-stat-grid strong { display: block; margin: 8px 0 4px; font-size: 21px; letter-spacing: -.04em; }
.ol-preview-stat-grid b { color: #2f7d42; font-size: 9px; }
.ol-preview-chart { margin-top: 14px; border: 1px solid #e7ddd2; border-radius: 10px; background: #fff; padding: 14px; }
.ol-preview-chart > div:first-child { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.ol-preview-chart > div:first-child strong { font-size: 11px; }
.ol-preview-bars { display: flex; align-items: flex-end; gap: 9px; height: 86px; margin-top: 14px; border-bottom: 1px solid #e7ddd2; }
.ol-preview-bars span { flex: 1; min-height: 14px; border-radius: 4px 4px 0 0; background: #e9c7bd; }
.ol-preview-bars span.is-highlight { background: #d41d0d; }
.ol-preview-chart-labels { display: flex; justify-content: space-between; padding-top: 7px; color: #806b57; font-size: 8px; }
.ol-preview-kitchen-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; height: calc(100% - 48px); background: #f1ece6; padding: 14px; }
.ol-preview-column { min-width: 0; }
.ol-preview-column header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; color: #806b57; font-size: 9px; font-weight: 700; letter-spacing: .1em; }
.ol-preview-column header b { display: grid; width: 20px; height: 20px; place-items: center; border-radius: 50%; background: #e7ddd2; color: #2a1c10; font-size: 9px; }
.ol-preview-ticket { border-left: 3px solid #d9cabb; border-radius: 8px; background: #fff; margin-bottom: 8px; padding: 10px; box-shadow: 0 2px 7px rgba(42,28,16,.06); }
.ol-preview-ticket.is-new { border-color: #d41d0d; }
.ol-preview-ticket.is-prep { border-color: #f5b400; }
.ol-preview-ticket.is-ready { border-color: #2f7d42; }
.ol-preview-ticket strong { display: block; font-size: 11px; }
.ol-preview-ticket small { display: block; margin-top: 3px; color: #806b57; font-size: 8px; }
.ol-preview-ticket p { margin: 9px 0; color: #6b5136; font-size: 9px; line-height: 1.45; }
.ol-preview-ticket button { width: 100%; border: 0; border-radius: 5px; background: #2a1c10; padding: 6px 4px; color: #fff; font: inherit; font-size: 8px; }
.ol-preview-service-layout { display: grid; grid-template-columns: minmax(0, 1fr) 170px; gap: 16px; height: calc(100% - 48px); padding: 18px; }
.ol-preview-table-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; align-content: start; }
.ol-preview-table-grid > span { display: flex; min-height: 55px; flex-direction: column; justify-content: center; border: 1px solid #d9cabb; border-radius: 9px; background: #fff; padding: 7px; font-size: 9px; font-weight: 700; }
.ol-preview-table-grid > span small { margin-top: 4px; color: #806b57; font-size: 8px; font-weight: 500; }
.ol-preview-table-grid > span.is-open { border-color: #f5b400; background: #fff9e9; }
.ol-preview-table-grid > span.is-waiting { border-color: #d41d0d; background: #fff1ee; }
.ol-preview-order-panel { border: 1px solid #e7ddd2; border-radius: 10px; background: #fff; padding: 14px; }
.ol-preview-order-panel > small { color: #806b57; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; }
.ol-preview-order-panel h3 { margin: 7px 0 16px; font-family: var(--font-instrument-serif), Georgia, serif; font-size: 22px; font-weight: 400; }
.ol-preview-order-panel p { margin: 7px 0; color: #6b5136; font-size: 10px; }
.ol-preview-order-panel hr { border: 0; border-top: 1px solid #e7ddd2; margin: 15px 0 10px; }
.ol-preview-order-panel > strong { display: block; margin-bottom: 14px; font-size: 18px; }
.ol-preview-order-panel button { width: 100%; background: #d41d0d; border-color: #d41d0d; color: #fff; }
.ol-preview-device-mobile { position: relative; max-width: 280px; margin: 0 auto; padding: 0 14px 58px; }
.ol-preview-mobile-top { display: flex; align-items: center; justify-content: space-between; height: 42px; border-bottom: 1px solid #e7ddd2; font-size: 11px; font-weight: 700; }
.ol-preview-mobile-hero { padding: 18px 2px 14px; }
.ol-preview-mobile-hero span { display: block; color: #806b57; font-size: 8px; text-transform: uppercase; letter-spacing: .1em; }
.ol-preview-mobile-hero strong { display: block; margin-top: 6px; font-family: var(--font-instrument-serif), Georgia, serif; font-size: 24px; font-weight: 400; }
.ol-preview-mobile-tabs { display: flex; gap: 14px; overflow: hidden; border-bottom: 1px solid #e7ddd2; padding: 0 0 10px; white-space: nowrap; }
.ol-preview-mobile-tabs span { color: #806b57; font-size: 9px; }
.ol-preview-mobile-tabs span.is-active { color: #d41d0d; font-weight: 700; }
.ol-preview-menu-item { display: grid; grid-template-columns: 43px minmax(0, 1fr) 20px; align-items: center; gap: 9px; border-bottom: 1px solid #e7ddd2; padding: 12px 0; }
.ol-preview-food-art { width: 43px; height: 43px; border-radius: 10px; background: radial-gradient(circle at 30% 30%, #f5b400 0 12%, transparent 13%), linear-gradient(135deg, #c9492f, #6d2717); }
.ol-preview-food-art.food-art-green { background: radial-gradient(circle at 65% 35%, #f5b400 0 10%, transparent 11%), linear-gradient(135deg, #75924b, #263a21); }
.ol-preview-menu-item strong, .ol-preview-menu-item small, .ol-preview-menu-item b { display: block; }
.ol-preview-menu-item strong { font-size: 10px; }
.ol-preview-menu-item small { overflow: hidden; margin: 3px 0; color: #806b57; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.ol-preview-menu-item b { color: #d41d0d; font-size: 9px; }
.ol-preview-menu-item i { display: grid; width: 20px; height: 20px; place-items: center; border-radius: 50%; background: #fff1ee; color: #d41d0d; font-size: 16px; font-style: normal; }
.ol-preview-order-bar { position: absolute; right: 14px; bottom: 12px; left: 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; border-radius: 9px; background: #d41d0d; padding: 11px 12px; color: #fff; font-size: 9px; }
.ol-preview-order-bar strong { font-size: 9px; }
.ol-showcase-controls { display: flex; align-items: center; gap: 14px; margin-top: 16px; }
.ol-showcase-arrow { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #d9cabb; border-radius: 50%; background: #fff; color: #2a1c10; cursor: pointer; font-size: 18px; transition: border-color .2s ease, background .2s ease, transform .2s ease; }
.ol-showcase-arrow:hover { border-color: #d41d0d; background: #fff1ee; transform: translateY(-1px); }
.ol-showcase-dots { display: flex; align-items: center; gap: 6px; }
.ol-showcase-dots button { width: 7px; height: 7px; border: 0; border-radius: 50%; background: #d9cabb; cursor: pointer; padding: 0; transition: background .2s ease, transform .2s ease; }
.ol-showcase-dots button.is-active { background: #d41d0d; transform: scale(1.35); }
.ol-showcase-count { margin-left: auto; color: #806b57; font-family: ui-monospace, monospace; font-size: 10px; }

/* Resultados */
.ol-results { background: #fbf8f4; padding: clamp(74px, 10vw, 126px) 32px; }
.ol-results-inner { max-width: 1180px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
.ol-results-head { max-width: 720px; text-align: center; }
.ol-results-head .ol-h2 { margin-top: 14px; }
.ol-results-head p { max-width: 580px; margin: 18px auto 0; color: #6b5136; font-size: 16px; line-height: 1.55; }
.ol-results-carousel { width: 100%; overflow: hidden; margin-top: 44px; }
.ol-results-track { display: flex; width: 100%; }
.ol-result-slide { flex: 0 0 33.333%; padding: 0 8px; }
.ol-result-card { position: relative; min-height: 218px; border: 1px solid #e7ddd2; border-radius: 20px; background: #fff; padding: 28px; transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease; }
.ol-result-card:hover { border-color: #d41d0d; transform: translateY(-2px); box-shadow: 0 14px 32px rgba(42,28,16,.09); }
.ol-result-number { color: #d41d0d; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; letter-spacing: .12em; }
.ol-result-card h3 { margin: 34px 0 10px; color: #2a1c10; font-family: var(--font-instrument-serif), Georgia, serif; font-size: 34px; font-weight: 400; line-height: 1; }
.ol-result-card p { max-width: 280px; margin: 0; color: #6b5136; font-size: 14px; line-height: 1.5; }
.ol-results-controls { display: flex; align-items: center; gap: 14px; width: 100%; max-width: 1140px; margin-top: 18px; padding: 0 8px; }
.ol-results-controls .ol-showcase-count { margin-left: 0; }
.ol-results-inner > .ol-cta-primary { margin-top: 30px; }

/* Como funciona */
.ol-como { background: #2a1c10; color: #fbf8f4; padding: clamp(80px, 12vw, 150px) 32px; }
.ol-como-inner { max-width: 1180px; margin: 0 auto; }
.ol-como .ol-head { margin-bottom: 64px; }
.ol-como-cta { display: flex; justify-content: center; margin-top: 50px; }
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
.ol-plan { position: relative; display: flex; flex-direction: column; align-items: center; border-radius: 24px; padding: 38px 30px; background: #fff; border: 1px solid #ece3d8; text-align: center; }
.ol-plan.is-hl { background: #2a1c10; border: none; box-shadow: 0 24px 60px rgba(42,28,16,.28); }
.ol-plan-bgglow { position: absolute; inset: -6px; border-radius: 28px; filter: blur(26px); opacity: .35; background: radial-gradient(circle, rgba(245,180,0,.55), transparent 70%); z-index: 0; }
.ol-plan-glow2 { position: absolute; inset: 0; border-radius: 24px; border: 2px solid #f5b400; box-sizing: border-box; filter: blur(5px); opacity: .55; box-shadow: 0 0 24px rgba(245,180,0,.45); z-index: 1; }
.ol-plan-glow1 { position: absolute; inset: 0; border-radius: 24px; border: 2px solid #f5b400; box-sizing: border-box; filter: blur(1.5px); opacity: .65; z-index: 2; }
.ol-plan-stroke { position: absolute; inset: 0; border-radius: 24px; border: 2px solid #f5b400; box-sizing: border-box; filter: url(#ol-electric); z-index: 3; }
.ol-plan-name { position: relative; z-index: 4; margin: 0; font-family: var(--font-instrument-serif), Georgia, serif; font-weight: 400; font-size: 40px; letter-spacing: -0.01em; color: #2a1c10; }
.ol-plan.is-hl .ol-plan-name { color: #f5b400; }
.ol-plan-tagline { position: relative; z-index: 4; margin: 8px 0 22px; font-size: 14px; font-weight: 600; color: #6b5136; }
.ol-plan.is-hl .ol-plan-tagline { color: rgba(251,248,244,.72); }
.ol-plan-feats { position: relative; z-index: 4; width: 100%; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 13px; text-align: left; }
.ol-plan-feat { display: flex; align-items: flex-start; gap: 11px; font-size: 15px; line-height: 1.45; color: #2a1c10; }
.ol-plan.is-hl .ol-plan-feat { color: rgba(251,248,244,.9); }
.ol-plan-check { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: rgba(212,29,13,.1); color: #d41d0d; font-size: 11px; font-weight: 700; margin-top: 1px; }
.ol-plan.is-hl .ol-plan-check { background: rgba(245,180,0,.16); color: #f5b400; }

/* FAQ */
.ol-faq-section { background: #fbf8f4; padding-top: clamp(64px, 9vw, 110px); padding-bottom: clamp(64px, 9vw, 110px); }
.ol-faq { width: min(100%, 980px); margin: 0 auto; display: grid; grid-template-rows: repeat(5, minmax(0, auto)); grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); column-gap: clamp(28px, 5vw, 64px); }
.ol-faq-item { border-top: 1px solid #d9cabb; }
.ol-faq-question { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 74px; padding: 18px 4px; color: #2a1c10; cursor: pointer; list-style: none; font-size: clamp(17px, 2vw, 21px); font-weight: 700; line-height: 1.25; }
.ol-faq-question::-webkit-details-marker { display: none; }
.ol-faq-question::after { content: "+"; flex: none; color: #d41d0d; font-family: ui-monospace, monospace; font-size: 26px; font-weight: 400; line-height: 1; transition: transform .2s ease; }
.ol-faq-item[open] .ol-faq-question::after { transform: rotate(45deg); }
.ol-faq-answer { max-width: 760px; margin: -4px 54px 24px 4px; color: #6b5136; font-size: 16px; line-height: 1.6; }

/* Contato */
.ol-contato { background: #fff; border-top: 1px solid #ece3d8; padding: clamp(80px, 12vw, 150px) 32px; }
.ol-contato-layout { max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; gap: 42px; align-items: center; }
.ol-contato-head { max-width: 720px; display: flex; flex-direction: column; align-items: center; gap: 26px; text-align: center; }
.ol-contato-sub { margin: 0; max-width: 600px; font-size: 17px; line-height: 1.5; color: #6b5136; }
.od-form { width: 100%; display: flex; flex-direction: column; gap: 18px; padding: 30px; border: 1px solid #ece3d8; border-radius: 24px; background: #fbf8f4; }
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
.od-identity-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.od-option-list { display: flex; flex-direction: column; gap: 10px; }
.od-option { display: flex; flex-direction: row; align-items: center; gap: 12px; min-height: 52px; border: 1px solid #d9cabb; border-radius: 14px; background: #fff; padding: 10px 13px; color: #2a1c10; cursor: pointer; font-size: 14px; font-weight: 600; transition: border-color .2s ease, background .2s ease, transform .2s ease; }
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
.od-diagnostic-result { display: flex; min-height: 360px; flex-direction: column; align-items: center; justify-content: center; gap: 10px; border: 1px solid #d8e8d9; border-radius: 24px; background: #f4fbf4; padding: 30px; text-align: center; }
.od-diagnostic-result.is-warning { border-color: #ecdcc5; background: #fffaf3; }
.od-result-kicker { color: #2f7d42; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.is-warning .od-result-kicker { color: #9a681f; }
.od-result-score { color: #205b2d; font-size: clamp(64px, 10vw, 104px); line-height: .9; letter-spacing: -.07em; }
.is-warning .od-result-score { color: #8a5b1d; }
.od-diagnostic-result h3 { margin: 0; color: #205b2d; font-size: clamp(22px, 3vw, 30px); letter-spacing: -.03em; }
.is-warning h3 { color: #754b16; }
.od-result-highlight { max-width: 430px; margin: 8px 0 0; color: #386342; font-size: 16px; line-height: 1.45; }
.od-result-highlight strong { color: #205b2d; }
.is-warning .od-result-highlight, .is-warning .od-result-highlight strong { color: #754b16; }
.od-result-projections { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; width: min(100%, 430px); margin-top: 6px; }
.od-result-projections div { display: flex; flex-direction: column; gap: 3px; border: 1px solid #d8e8d9; border-radius: 14px; background: rgba(255,255,255,.62); padding: 12px 10px; }
.od-result-projections strong { color: #205b2d; font-size: 25px; letter-spacing: -.04em; }
.od-result-projections span { color: #64806a; font-size: 11px; }
.is-warning .od-result-projections div { border-color: #ecdcc5; }
.is-warning .od-result-projections strong { color: #754b16; }
.is-warning .od-result-projections span { color: #8a704e; }
.od-result-note { max-width: 430px; margin: 0; color: #64806a; font-size: 11px; line-height: 1.45; }
.is-warning .od-result-note { color: #8a704e; }
.od-result-message { margin: 4px 0 0; color: #4d6f54; font-size: 13px; }
.is-warning .od-form-error { margin-top: 4px; }
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
  .ol-hero-content { width: min(100% - 40px, 680px); padding: 88px 0 78px; gap: 24px; }
  .ol-hero-title { font-size: clamp(42px, 12vw, 68px); }
  .ol-hero-sub { font-size: 16px; }
  .ol-showcase { padding-left: 24px; padding-right: 24px; }
  .ol-showcase-inner { grid-template-columns: 1fr; gap: 38px; }
  .ol-showcase-copy { align-items: center; text-align: center; }
  .ol-showcase-copy p { max-width: 560px; }
  .ol-preview-appbar small { display: none; }
  .ol-results { padding-left: 24px; padding-right: 24px; }
  .ol-result-slide { flex-basis: 50%; }
  .ol-segment-grid, .ol-metrics, .ol-contato-layout { grid-template-columns: 1fr; }
  .ol-metrics { gap: 30px; }
  .ol-contato-layout { gap: 38px; }
  .od-form { padding: 22px 18px; }
}

@media (max-width: 480px) {
  .ol-sec, .ol-como, .ol-contato { padding-left: 20px; padding-right: 20px; }
  .ol-showcase { padding-left: 20px; padding-right: 20px; }
  .ol-showcase-viewport { aspect-ratio: 4 / 3; padding: 10px; border-radius: 18px; }
  .ol-showcase-label { align-items: center; flex-direction: column; gap: 5px; margin-bottom: 10px; }
  .ol-preview-management { padding: 14px; }
  .ol-preview-management h3 { font-size: 20px; }
  .ol-preview-stat-grid { gap: 6px; }
  .ol-preview-stat-grid > div { padding: 9px; }
  .ol-preview-stat-grid strong { font-size: 15px; }
  .ol-preview-kitchen-grid { gap: 6px; padding: 9px; }
  .ol-preview-ticket { padding: 7px; }
  .ol-preview-ticket p { margin: 6px 0; }
  .ol-preview-service-layout { grid-template-columns: 1fr; padding: 10px; }
  .ol-preview-order-panel { display: none; }
  .ol-results { padding-left: 20px; padding-right: 20px; }
  .ol-result-slide { flex-basis: 100%; }
  .ol-result-slide:not(:first-child) { display: none; }
  .ol-result-card { min-height: 190px; padding: 24px; }
  .ol-result-card h3 { margin-top: 28px; font-size: 32px; }
  .od-form-grid, .ol-metrics-list { grid-template-columns: 1fr; }
  .od-form-actions .od-form-submit { flex: 1; }
  .od-identity-grid { grid-template-columns: 1fr; }
  .od-result-projections { grid-template-columns: 1fr; }
  .od-slide-question h4 { font-size: 26px; }
  .ol-faq { display: block; border-top: 1px solid #d9cabb; }
  .ol-faq-item { border-top: 0; border-bottom: 1px solid #d9cabb; }
  .ol-faq-question { min-height: 68px; padding: 16px 0; font-size: 17px; }
  .ol-faq-answer { margin: -2px 34px 20px 0; font-size: 15px; }
  .ol-hero-ctas { align-items: stretch; flex-direction: column; width: 100%; }
  .ol-cta-primary, .ol-cta-ghost { justify-content: center; }
}
`;
