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
// (pela app ou pelo atendente); quando pago, a mesa zera-se e o cartão sai.
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
    <main className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-lg font-medium">Cozinha</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            live ? "bg-green-100 text-green-900" : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {live ? "ao vivo" : "a ligar…"}
        </span>
      </div>

      {calls.length > 0 && (
        <section className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <h2 className="mb-2 text-sm font-medium text-amber-900">
            Atendente chamado
          </h2>
          <ul className="space-y-2">
            {calls.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-amber-900">
                  {c.tableLabel} · {minutesAgo(c.createdAt)}
                </span>
                <button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await resolveWaiterCall(c.id);
                    })
                  }
                  className="rounded-lg border border-amber-400 px-3 py-1 text-sm text-amber-900"
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
          return (
            <section key={col.status}>
              <h2 className="mb-2 text-sm font-medium text-neutral-500">
                {col.title} ({list.length})
              </h2>
              <ul className="space-y-3">
                {list.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-lg border border-neutral-200 p-3"
                  >
                    <div className="flex items-baseline justify-between">
                      <p className="font-medium">{o.tableLabel}</p>
                      <span className="text-xs text-neutral-400">
                        {minutesAgo(o.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-neutral-500">
                        {o.customerName ?? "sem nome"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          o.paid
                            ? "bg-green-100 text-green-900"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {o.paid ? "Pago" : "Por pagar"}
                      </span>
                    </div>
                    <ul className="my-2 space-y-1">
                      {o.items.map((i) => (
                        <li key={i.id} className="text-sm">
                          <span className="font-medium">{i.qty}×</span> {i.name}
                          {i.modifiers.length > 0 && (
                            <span className="block text-xs text-neutral-500">
                              {i.modifiers.join(", ")}
                            </span>
                          )}
                          {i.notes && (
                            <span className="block text-xs text-amber-700">
                              {i.notes}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="mb-2 text-sm text-neutral-500">
                      {formatMoney(o.totalCents)}
                    </p>
                    {col.status === "served" && !o.paid && (
                      <p className="mb-2 text-xs text-neutral-400">
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
                          className="flex-1 rounded-lg bg-black py-2 text-sm text-white disabled:opacity-40"
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
                          className="rounded-lg border border-green-400 px-3 py-2 text-sm text-green-800"
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
                        className="rounded-lg border border-neutral-300 px-3 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </li>
                ))}
                {list.length === 0 && (
                  <li className="rounded-lg border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-400">
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
