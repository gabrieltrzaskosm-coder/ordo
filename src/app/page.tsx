import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

// Landing pública da Otium: apresenta o produto a restaurantes (e serve de site
// oficial para análise de adquirentes/ADs). Server component estático = rápido.
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <span className="flex items-center gap-2 font-semibold tracking-tight text-ink">
            <span className="h-2.5 w-2.5 rounded-full bg-brand" />
            Otium
          </span>
          <Link
            href="/login"
            className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink transition hover:border-brand/40"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-14 px-5 py-12">
        {/* Herói */}
        <section>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Pedido &amp; pagamento por QR code
          </span>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            Receba <span className="text-brand">100%</span> do que vende.
            <br />
            0% de comissão.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            O cliente escaneia o QR na mesa, pede e paga no Pix pelo próprio
            celular. O pedido cai na cozinha — e o dinheiro, direto na sua conta.
          </p>
        </section>

        {/* Faixa do dinheiro */}
        <section className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <div>
            <p className="text-3xl font-bold leading-none text-success">0%</p>
            <p className="mt-1 text-sm text-muted">de comissão nossa</p>
          </div>
          <div>
            <p className="text-3xl font-bold leading-none text-success">Pix</p>
            <p className="mt-1 text-sm text-muted">dinheiro direto na sua conta</p>
          </div>
          <p className="border-l border-line pl-8 text-sm text-muted">
            O cliente pede e paga sozinho:
            <br />
            <span className="font-semibold text-ink">menos fila</span> e{" "}
            <span className="font-semibold text-ink">mais giro de mesa</span>.
          </p>
        </section>

        {/* Como funciona */}
        <section>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted">
            Como funciona
          </h2>
          <ol className="flex flex-col gap-4">
            {[
              "O cliente escaneia o QR da mesa — sem baixar app, só a câmera.",
              "Pede e paga no Pix, cartão ou Apple Pay, no próprio celular.",
              "O pedido cai na cozinha em tempo real; o dinheiro, na sua conta.",
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-brand-ink">
                  {i + 1}
                </span>
                <p className="pt-1 text-ink">{t}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Benefícios */}
        <section>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted">
            Por que o seu restaurante vai gostar
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["0% de comissão", "Você recebe 100% da venda, direto no seu Pix — sem intermediário levando um pedaço."],
              ["Menos fila, mais giro", "O cliente pede e paga sozinho. A mesa vira mais rápido, sem esperar a conta."],
              ["Menos dependência de garçom", "Na hora do rush, cada cliente se atende. Sua equipe foca no que importa."],
              ["Sem app pra baixar", "Só a câmera do celular. Funciona na hora, pra qualquer cliente."],
              ["Cardápio digital", "Atualize preços e itens num clique. Nunca mais reimprima cardápio."],
              ["Mais avaliações no Google", "Convide o cliente satisfeito a avaliar no fim. Mais estrelas, mais clientes."],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-ink p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-canvas">
            Teste grátis. Nós montamos tudo pra você.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-canvas/70">
            Cardápio, mesas, QR e treino da equipe — por nossa conta, sem
            compromisso.
          </p>
          <a
            href="mailto:otium.sap@gmail.com"
            className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-brand-ink transition hover:opacity-90"
          >
            otium.sap@gmail.com
          </a>
          <p className="mt-3 text-xs text-canvas/60">
            Fale conosco e agende uma demonstração.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
