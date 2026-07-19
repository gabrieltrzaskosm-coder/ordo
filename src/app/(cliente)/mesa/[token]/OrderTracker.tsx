"use client";

import { useEffect, useState } from "react";
import { getTableStatus, type TrackedOrder } from "./actions";

const STEPS: { key: TrackedOrder["status"]; label: string }[] = [
  { key: "placed", label: "Recebido" },
  { key: "in_prep", label: "Em preparação" },
  { key: "ready", label: "Pronto" },
  { key: "served", label: "Entregue" },
];

function stepIndex(status: TrackedOrder["status"]) {
  return STEPS.findIndex((s) => s.key === status);
}

export function OrderTracker({ token }: { token: string }) {
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);

  useEffect(() => {
    let alive = true;
    async function poll() {
      const data = await getTableStatus(token);
      if (alive) setOrders(data);
    }
    poll();
    // Consulta a cada 5s — o cliente é anónimo, por isso não há subscrição
    // Realtime; o polling do servidor (validado por token) mantém-no atualizado.
    const id = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [token]);

  if (!orders || orders.length === 0) return null;

  return (
    <section className="mb-6 space-y-3">
      <h2 className="text-sm font-medium text-neutral-500">O seu pedido</h2>
      {orders.map((o) => {
        const current = stepIndex(o.status);
        return (
          <div key={o.id} className="rounded-lg border border-neutral-200 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm">
                {o.customerName ?? "Pedido"}
                <span className="text-neutral-400">
                  {" · "}
                  {o.items.reduce((n, i) => n + i.qty, 0)} item(s)
                </span>
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

            <ol className="flex items-center">
              {STEPS.map((s, i) => {
                const done = i <= current;
                const doneBar = "bg-green-500";
                const pendingBar = "bg-neutral-200 dark:bg-neutral-700";
                return (
                  <li key={s.key} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {i > 0 && (
                        <div
                          className={`h-0.5 flex-1 ${
                            i <= current ? doneBar : pendingBar
                          }`}
                        />
                      )}
                      <div
                        className={`h-3 w-3 shrink-0 rounded-full ${
                          done ? doneBar : pendingBar
                        }`}
                      />
                      {i < STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 ${
                            i < current ? doneBar : pendingBar
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-1 text-center text-[11px] ${
                        done
                          ? "font-medium text-neutral-900 dark:text-neutral-100"
                          : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
