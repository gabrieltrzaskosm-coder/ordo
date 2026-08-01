import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";

const beneficios = [
  {
    titulo: "0% de comissão",
    corpo: "Você recebe 100% da venda, direto no seu Pix — sem intermediário levando um pedaço.",
  },
  {
    titulo: "Menos fila, mais giro",
    corpo: "O cliente pede e paga sozinho. A mesa vira mais rápido, sem esperar a conta.",
  },
  {
    titulo: "Menos dependência de garçom",
    corpo: "Na hora do rush, cada cliente se atende. Sua equipe foca no que importa.",
  },
  {
    titulo: "Sem app pra baixar",
    corpo: "Só a câmera do celular. Funciona na hora, pra qualquer cliente.",
  },
  {
    titulo: "Cardápio sempre atualizado",
    corpo: "Mude preços e itens num clique. Nunca mais reimprima cardápio.",
  },
  {
    titulo: "Mais avaliações no Google",
    corpo: "Convide o cliente satisfeito a avaliar no fim. Mais estrelas, mais clientes.",
  },
];

const passos = [
  "O cliente escaneia o QR da mesa — sem baixar app, só a câmera.",
  "Pede e paga no Pix, cartão ou Apple Pay, no próprio celular.",
  "O pedido cai na cozinha em tempo real; o dinheiro, na sua conta.",
];

// Planos (cumulativos: cada um inclui o anterior). Sem preço na landing — a
// conversa de valor é feita na demonstração. Ver plano→features no roteiro.
const planos = [
  {
    nome: "Basic",
    tagline: "Comece a vender pela mesa.",
    inclui: null,
    destaque: false,
    features: [
      "Cardápio digital por QR code",
      "Pedido direto na cozinha, em tempo real",
      "Pagamento no Pix, cartão e Apple Pay",
      "Marque itens como esgotado num toque",
    ],
  },
  {
    nome: "Pro",
    tagline: "Enxergue o seu negócio.",
    inclui: "Basic",
    destaque: false,
    features: [
      "Balanço financeiro diário e mensal",
      "Exportação dos relatórios",
      "Insights: horas de pico, ticket médio e mais vendidos",
      "Tendências de venda pra decidir melhor",
    ],
  },
  {
    nome: "Max",
    tagline: "O restaurante no piloto automático.",
    inclui: "Pro",
    destaque: true,
    features: [
      "Controle de estoque automático (baixa, alerta e esgota sozinho)",
      "IA: resumo inteligente do seu dia e da semana",
      "Previsão de procura e destaque do mais pedido",
      "Suporte 24/7",
    ],
  },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--l-brand)]"
    >
      <path
        d="M4 10.5l3.5 3.5L16 5.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Landing pública da Ordo (produto da Otium). Paleta quente e ousada escopada na
// classe `.landing` (ver globals.css) — não afeta os temas da app. Server
// component estático = rápido.
export default function Home() {
  return (
    <div className="landing flex min-h-screen flex-col bg-[var(--l-canvas)] text-[var(--l-ink)]">
      <header className="border-b border-[var(--l-line)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="flex items-baseline gap-2">
            <span className="font-display flex items-center gap-2 text-xl font-extrabold tracking-tight">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--l-brand)]" />
              Ordo
            </span>
            <span className="text-xs text-[var(--l-muted)]">por Otium</span>
          </span>
          <Link
            href="/login"
            className="rounded-full border border-[var(--l-line)] px-4 py-1.5 text-sm font-medium transition hover:border-[var(--l-brand)]/50 hover:text-[var(--l-brand)]"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-24 px-5 py-16 sm:py-20">
        {/* Herói */}
        <section className="grid items-center gap-12 sm:grid-cols-[1.1fr_1fr]">
          <div>
            <span
              className="reveal inline-flex items-center gap-2 rounded-full bg-[var(--l-amber)]/20 px-3 py-1 text-xs font-semibold text-[var(--l-brown)]"
            >
              Fuja do iFood · 0% de comissão
            </span>
            <h1
              className="reveal font-display mt-4 text-5xl font-extrabold leading-[0.98] tracking-[-0.03em] sm:text-6xl"
              style={{ animationDelay: "40ms", textWrap: "balance" }}
            >
              Receba <span className="text-[var(--l-brand)]">100%</span> do que
              vende.
              <br />
              <span className="text-[var(--l-brand)]">0%</span> de comissão.
            </h1>
            <p
              className="reveal mt-5 max-w-md text-lg text-[var(--l-muted)]"
              style={{ animationDelay: "100ms", textWrap: "pretty" }}
            >
              O cliente escaneia o QR da mesa e pede pela Ordo: paga no Pix,
              cartão ou Apple Pay, no próprio celular. O pedido cai na cozinha —
              e o dinheiro, direto na sua conta.
            </p>
            <p
              className="reveal mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-[var(--l-muted)]"
              style={{ animationDelay: "150ms" }}
            >
              <span className="font-semibold text-[var(--l-ink)]">Pix</span>
              <span aria-hidden>·</span>
              <span className="font-semibold text-[var(--l-ink)]">cartão</span>
              <span aria-hidden>·</span>
              <span className="font-semibold text-[var(--l-ink)]">Apple Pay</span>
              <span aria-hidden>·</span>
              <span>sem app pra baixar</span>
            </p>
            <div
              className="reveal mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "200ms" }}
            >
              <a
                href="#demonstracao"
                className="rounded-full bg-[var(--l-brand)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_var(--l-brand)] transition hover:bg-[var(--l-brand-strong)]"
              >
                Pedir uma demonstração
              </a>
              <a
                href="#como-funciona"
                className="rounded-full px-4 py-3 text-sm font-semibold transition hover:text-[var(--l-brand)]"
              >
                Ver como funciona →
              </a>
            </div>
          </div>

          <div
            className="reveal relative aspect-[4/5] overflow-hidden rounded-3xl shadow-[0_24px_60px_-20px_rgba(58,36,16,0.5)] sm:aspect-square"
            style={{ animationDelay: "120ms" }}
          >
            <Image
              src="https://images.unsplash.com/photo-1556742205-e10c9486e506?auto=format&fit=crop&w=1200&q=80"
              alt="Celular com o pedido aberto sobre a mesa do restaurante, ao lado do prato"
              fill
              sizes="(min-width: 640px) 440px, 90vw"
              className="object-cover"
              priority
            />
            <div className="absolute bottom-4 left-4 rounded-full bg-[var(--l-amber)] px-4 py-2 text-xs font-bold text-[var(--l-ink)] shadow-lg">
              Pago no Pix ✓
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="scroll-mt-20">
          <h2 className="font-display mb-8 text-3xl font-bold tracking-tight">
            Como funciona
          </h2>
          <ol className="grid gap-8 sm:grid-cols-3">
            {passos.map((t, i) => (
              <li
                key={i}
                className="reveal"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="tnum font-display flex h-11 w-11 items-center justify-center rounded-full bg-[var(--l-brand)] text-lg font-extrabold text-white">
                  {i + 1}
                </span>
                <p className="mt-4 text-[var(--l-ink)]">{t}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Benefícios */}
        <section className="grid items-start gap-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <div>
            <h2
              className="font-display text-3xl font-bold leading-[1.05] tracking-tight"
              style={{ textWrap: "balance" }}
            >
              Feito pra restaurante{" "}
              <span className="text-[var(--l-brand)]">ganhar mais</span>, não pra
              pagar mais comissão.
            </h2>
            <p className="mt-4 max-w-sm text-[var(--l-muted)]">
              Tudo que a Ordo faz mira uma coisa: mais dinheiro no seu caixa e
              menos trabalho na sua equipe.
            </p>
          </div>
          <ul className="divide-y divide-[var(--l-line)]">
            {beneficios.map((b, i) => (
              <li
                key={b.titulo}
                className="reveal flex gap-4 py-4 first:pt-0"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--l-amber)]"
                />
                <div>
                  <h3 className="font-semibold text-[var(--l-ink)]">
                    {b.titulo}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--l-muted)]">{b.corpo}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Planos — caixas cumulativas, sem preço (valor conversa-se na demo) */}
        <section id="planos" className="scroll-mt-20">
          <div className="mb-8 max-w-xl">
            <h2
              className="font-display text-3xl font-bold tracking-tight"
              style={{ textWrap: "balance" }}
            >
              Um plano pra cada momento do seu restaurante
            </h2>
            <p className="mt-3 text-[var(--l-muted)]">
              Cada plano inclui tudo do anterior. Todos com{" "}
              <span className="font-semibold text-[var(--l-ink)]">
                0% de comissão
              </span>{" "}
              — você nunca divide a venda com a gente.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {planos.map((plano) => (
              <div
                key={plano.nome}
                className={
                  "relative flex flex-col rounded-2xl bg-[var(--l-surface)] p-6 " +
                  (plano.destaque
                    ? "border-2 border-[var(--l-brand)] shadow-[0_20px_50px_-24px_rgba(58,36,16,0.5)]"
                    : "border border-[var(--l-line)]")
                }
              >
                {plano.destaque && (
                  <span className="absolute -top-3 left-6 rounded-full bg-[var(--l-amber)] px-3 py-1 text-xs font-bold text-[var(--l-ink)]">
                    Mais completo
                  </span>
                )}
                <h3
                  className={
                    "font-display text-2xl font-extrabold tracking-tight " +
                    (plano.destaque
                      ? "text-[var(--l-brand)]"
                      : "text-[var(--l-ink)]")
                  }
                >
                  {plano.nome}
                </h3>
                <p className="mt-1 text-sm text-[var(--l-muted)]">
                  {plano.tagline}
                </p>

                <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--l-muted)]">
                  {plano.inclui ? `Tudo do ${plano.inclui}, mais:` : "Inclui:"}
                </p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {plano.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-[var(--l-ink)]">
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#demonstracao"
                  className={
                    "mt-6 block rounded-full py-2.5 text-center text-sm font-semibold transition " +
                    (plano.destaque
                      ? "bg-[var(--l-brand)] text-white hover:bg-[var(--l-brand-strong)]"
                      : "border border-[var(--l-line)] text-[var(--l-ink)] hover:border-[var(--l-brand)]/50 hover:text-[var(--l-brand)]")
                  }
                >
                  Falar sobre o {plano.nome}
                </a>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-[var(--l-muted)]">
            Sem saber qual escolher? A gente monta tudo e ajuda você a decidir na
            demonstração — instalação e treino por nossa conta.
          </p>
        </section>

        {/* CTA — faixa drenched em castanho-torrado, com foto */}
        <section
          id="demonstracao"
          className="scroll-mt-20 overflow-hidden rounded-3xl bg-[var(--l-brown)]"
        >
          <div className="grid items-center gap-8 sm:grid-cols-2">
            <div className="relative order-last aspect-[4/3] w-full sm:order-first sm:aspect-auto sm:self-stretch">
              <Image
                src="https://images.unsplash.com/photo-1760623681430-9224e69d9683?auto=format&fit=crop&w=1200&q=80"
                alt="Duas clientes conversando à mesa de um café, uma delas com o celular na mão"
                fill
                sizes="(min-width: 640px) 50vw, 90vw"
                className="object-cover"
              />
            </div>
            <div className="p-8 sm:p-10">
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                Teste grátis.
                <br />
                Nós montamos tudo pra você.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-[var(--l-on-brown)]">
                Cardápio, mesas, QR e treino da equipe — por nossa conta, sem
                compromisso.
              </p>
              <a
                href="mailto:otium.sap@gmail.com"
                className="mt-6 inline-block rounded-full bg-[var(--l-amber)] px-6 py-3 font-semibold text-[var(--l-ink)] transition hover:brightness-105"
              >
                otium.sap@gmail.com
              </a>
              <p className="mt-3 text-xs text-[var(--l-on-brown)]">
                Fale conosco e agende uma demonstração.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
