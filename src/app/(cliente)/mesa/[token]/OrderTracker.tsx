"use client";

import { useEffect, useState } from "react";
import { getTableStatus, type TrackedOrder } from "./actions";

const STEPS: { key: TrackedOrder["status"]; label: string }[] = [
  { key: "placed", label: "Recebido" },
  { key: "in_prep", label: "A preparar" },
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
    <section className="mb-8 space-y-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
        O seu pedido
      </h2>
      {orders.map((o) => {
        const current = stepIndex(o.status);
        const itemCount = o.items.reduce((n, i) => n + i.qty, 0);
        return (
          <div
            key={o.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-ink">
                {o.customerName ?? "Pedido"}
                <span className="font-normal text-muted">
                  {" · "}
                  {itemCount} {itemCount === 1 ? "item" : "itens"}
                </span>
              </p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  o.paid
                    ? "bg-success-weak text-success"
                    : "bg-surface-2 text-muted"
                }`}
              >
                {o.paid ? "Pago" : "Por pagar"}
              </span>
            </div>

            <ol className="flex items-start">
              {STEPS.map((s, i) => {
                const done = i <= current;
                const active = i === current;
                return (
                  <li
                    key={s.key}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div className="flex w-full items-center">
                      <span
                        className={`h-0.5 flex-1 rounded-full transition-colors ${
                          i > 0 && i <= current ? "bg-success" : "bg-line"
                        } ${i === 0 ? "opacity-0" : ""}`}
                      />
                      <span
                        className={`relative flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-colors ${
                          done ? "bg-success" : "bg-line"
                        }`}
                      >
                        {active && (
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                        )}
                      </span>
                      <span
                        className={`h-0.5 flex-1 rounded-full transition-colors ${
                          i < current ? "bg-success" : "bg-line"
                        } ${i === STEPS.length - 1 ? "opacity-0" : ""}`}
                      />
                    </div>
                    <span
                      className={`mt-1.5 text-center text-[11px] leading-tight ${
                        done ? "font-semibold text-ink" : "text-muted"
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
