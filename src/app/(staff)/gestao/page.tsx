import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const NAV = [
  {
    href: "/gestao/menu",
    title: "Menu",
    desc: "Categorias, pratos, preços e IVA.",
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
    title: "Equipa",
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
    title: "Faturação",
    desc: "Ligar o Vendus para emitir a fatura-recibo (AT).",
    icon: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h4",
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
      <h1 className="text-2xl font-semibold text-ink">Gestão</h1>
      <p className="mt-1 text-sm text-muted">{session.establishmentName}</p>

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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d={item.icon}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{item.title}</p>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
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
          </Link>
        ))}
      </div>
    </main>
  );
}
