"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/money";
import {
  advanceOrder,
  cancelOrder,
  markPaid,
  resolveWaiterCall,
} from "./actions";
import type { Database } from "@/lib/supabase/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export type KitchenOrder = {
  id: string;
  customerName: string | null;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  paid: boolean;
  tableLabel: string;
  items: {
    id: string;
    name: string;
    qty: number;
    notes: string | null;
    modifiers: string[];
  }[];
};

export type WaiterCall = { id: string; createdAt: string; tableLabel: string };

// cta vazio = estado terminal na cozinha (Entregue). Aí só falta o pagamento
// (pela app ou pelo garçom); quando pago, a mesa zera-se e o cartão sai.
const COLUMNS: { status: OrderStatus; title: string; cta: string }[] = [
  { status: "placed", title: "Novos", cta: "Iniciar preparo" },
  { status: "in_prep", title: "Em preparo", cta: "Marcar pronto" },
  { status: "ready", title: "Prontos", cta: "Marcar servido" },
  { status: "served", title: "Entregues", cta: "" },
];

function minutesAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "agora";
  return `há ${mins} min`;
}

export function KitchenBoard({
  orders,
  calls,
  establishmentId,
}: {
  orders: KitchenOrder[];
  calls: WaiterCall[];
  establishmentId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [live, setLive] = useState(false);

  // Realtime: qualquer alteração em orders/order_items/waiter_calls do nosso
  // estabelecimento refaz os dados do servidor. Refetch em vez de fundir o
  // payload à mão — mais simples e sem risco de divergir da BD.
  useEffect(() => {
    const supabase = createClient();
    const filter = `establishment_id=eq.${establishmentId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // Obrigatório: sem o token no socket, o Realtime avalia a RLS como `anon`
      // e, como o anon não tem políticas, o canal fica SUBSCRIBED mas nunca
      // recebe eventos — falha silenciosa.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) await supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel("cozinha")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter },
          () => router.refresh(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "order_items", filter },
          () => router.refresh(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "waiter_calls", filter },
          () => router.refresh(),
        )
        .subscribe((status) => setLive(status === "SUBSCRIBED"));
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router, establishmentId]);

  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="mb-5 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-ink">Cozinha</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            live ? "bg-success-weak text-success" : "bg-surface-2 text-muted"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              live ? "animate-pulse bg-success" : "bg-muted"
            }`}
          />
          {live ? "ao vivo" : "a ligar…"}
        </span>
      </div>

      {calls.length > 0 && (
        <section className="mb-6 rounded-2xl border border-warn/30 bg-warn-weak p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-warn">
            <BellIcon /> Garçom chamado
          </h2>
          <ul className="space-y-2">
            {calls.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">
                  {c.tableLabel}{" "}
                  <span className="font-normal text-muted">
                    · {minutesAgo(c.createdAt)}
                  </span>
                </span>
                <button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await resolveWaiterCall(c.id);
                    })
                  }
                  className="rounded-full border border-warn/40 bg-surface px-3 py-1.5 text-sm font-medium text-warn transition active:scale-95"
                >
                  Atendido
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status);
          const highlight = col.status === "placed";
          return (
            <section key={col.status}>
              <h2 className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-ink">
                  {col.title}
                </span>
                <span
                  className={`min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${
                    highlight && list.length > 0
                      ? "bg-brand text-brand-ink"
                      : "bg-surface-2 text-muted"
                  }`}
                >
                  {list.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {list.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-2xl border border-line bg-surface p-3.5 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-baseline justify-between">
                      <p className="font-semibold text-ink">{o.tableLabel}</p>
                      <span className="text-xs text-muted">
                        {minutesAgo(o.createdAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="text-sm text-muted">
                        {o.customerName ?? "sem nome"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          o.paid
                            ? "bg-success-weak text-success"
                            : "bg-surface-2 text-muted"
                        }`}
                      >
                        {o.paid ? "Pago" : "Por pagar"}
                      </span>
                    </div>
                    <ul className="my-3 space-y-1.5 border-y border-line py-2.5">
                      {o.items.map((i) => (
                        <li key={i.id} className="text-sm text-ink">
                          <span className="tnum font-semibold text-brand">
                            {i.qty}×
                          </span>{" "}
                          {i.name}
                          {i.modifiers.length > 0 && (
                            <span className="block pl-6 text-xs text-muted">
                              {i.modifiers.join(", ")}
                            </span>
                          )}
                          {i.notes && (
                            <span className="block pl-6 text-xs font-medium text-warn">
                              {i.notes}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="tnum mb-3 text-sm font-medium text-ink">
                      {formatMoney(o.totalCents)}
                    </p>
                    {col.status === "served" && !o.paid && (
                      <p className="mb-3 text-xs text-muted">
                        A aguardar pagamento — a mesa zera-se ao ficar paga.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {col.cta && (
                        <button
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await advanceOrder(o.id, o.status);
                            })
                          }
                          className="flex-1 rounded-full bg-brand py-2 text-sm font-semibold text-brand-ink transition active:scale-[0.98] disabled:opacity-40"
                        >
                          {col.cta}
                        </button>
                      )}
                      {!o.paid && (
                        <button
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await markPaid(o.id);
                            })
                          }
                          className="rounded-full border border-success/40 bg-surface px-3 py-2 text-sm font-medium text-success transition active:scale-95"
                        >
                          Marcar pago
                        </button>
                      )}
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await cancelOrder(o.id);
                          })
                        }
                        className="rounded-full border border-line px-3 py-2 text-sm text-muted transition hover:text-ink active:scale-95"
                        aria-label="Cancelar pedido"
                      >
                        Cancelar
                      </button>
                    </div>
                  </li>
                ))}
                {list.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
                    Vazio
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
