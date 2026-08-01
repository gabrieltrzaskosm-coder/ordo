"use client";

// Aba do atendente (garçom): 3 painéis num só ecrã, com atualização em tempo real
//  1) Pedido    — escolhe a mesa e monta o pedido (reusa o núcleo de criação);
//  2) Chamadas  — mesas que chamaram o garçom (notificação de "ir à mesa");
//  3) Pagamentos— pedidos em aberto e de que mesa são; botão para cobrar.
// O Realtime refaz os dados do servidor a cada mudança em orders/waiter_calls —
// por isso as chamadas e os pagamentos aparecem sozinhos.
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MenuCategory, MenuItem } from "@/lib/menu";
import { formatMoney } from "@/lib/money";
import { createStaffOrder } from "./actions";
import { markPaid, resolveWaiterCall } from "../cozinha/actions";

export type TableRow = { id: string; label: string };
export type OpenCall = { id: string; createdAt: string; tableLabel: string };
export type OpenPayment = {
  id: string;
  tableLabel: string;
  customerName: string | null;
  totalCents: number;
  status: string;
  items: { name: string; qty: number }[];
};

type ChosenModifier = { id: string; name: string; delta: number; qty: number };
type CartLine = {
  key: string;
  itemId: string;
  name: string;
  basePriceCents: number;
  qty: number;
  modifiers: ChosenModifier[];
};

function lineKey(itemId: string, mods: ChosenModifier[]) {
  return (
    itemId + "|" + mods.map((m) => `${m.id}x${m.qty}`).sort().join(",")
  );
}
function lineUnit(l: CartLine) {
  return l.basePriceCents + l.modifiers.reduce((s, m) => s + m.delta * m.qty, 0);
}
function modLabel(m: { name: string; qty: number }) {
  return m.qty > 1 ? `${m.qty}× ${m.name}` : m.name;
}
function minutesAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora mesmo";
  if (min === 1) return "há 1 min";
  return `há ${min} min`;
}

type Tab = "pedido" | "chamadas" | "pagamentos";

export function Atendimento({
  establishmentId,
  menu,
  tables,
  calls,
  payments,
}: {
  establishmentId: string;
  menu: MenuCategory[];
  tables: TableRow[];
  calls: OpenCall[];
  payments: OpenPayment[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>(calls.length > 0 ? "chamadas" : "pedido");
  const [status, setStatus] = useState<string | null>(null);

  // Realtime: qualquer mudança em orders/waiter_calls refaz os dados do servidor.
  useEffect(() => {
    const supabase = createClient();
    const filter = `establishment_id=eq.${establishmentId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) await supabase.realtime.setAuth(session.access_token);
      channel = supabase
        .channel("atendimento")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter },
          () => router.refresh(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "waiter_calls", filter },
          () => router.refresh(),
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router, establishmentId]);

  // ---------- Montar pedido ----------
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [modQty, setModQty] = useState<Record<string, number>>({});

  const cartTotal = cart.reduce((s, l) => s + lineUnit(l) * l.qty, 0);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);

  function addLine(item: MenuItem, mods: ChosenModifier[]) {
    const key = lineKey(item.id, mods);
    setCart((c) => {
      const existing = c.find((l) => l.key === key);
      if (existing) {
        return c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      }
      return [
        ...c,
        {
          key,
          itemId: item.id,
          name: item.name,
          basePriceCents: item.priceCents,
          qty: 1,
          modifiers: mods,
        },
      ];
    });
  }
  function changeQty(key: string, delta: number) {
    setCart((c) =>
      c
        .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }
  function onAddClick(item: MenuItem) {
    if (item.groups.length === 0) addLine(item, []);
    else {
      setChoices({});
      setModQty({});
      setModalItem(item);
    }
  }
  function groupUnits(g: MenuItem["groups"][number]) {
    return (choices[g.id] ?? []).reduce((s, id) => s + (modQty[id] ?? 1), 0);
  }
  function bumpModQty(g: MenuItem["groups"][number], id: string, delta: number) {
    setModQty((q) => {
      const cur = q[id] ?? 1;
      if (delta > 0 && groupUnits(g) >= g.maxSelect) return q;
      return { ...q, [id]: Math.max(1, cur + delta) };
    });
  }
  function toggleChoice(g: MenuItem["groups"][number], modId: string) {
    if (g.single) {
      setChoices((c) => ({ ...c, [g.id]: [modId] }));
      return;
    }
    const cur = choices[g.id] ?? [];
    if (cur.includes(modId)) {
      setChoices((c) => ({
        ...c,
        [g.id]: (c[g.id] ?? []).filter((x) => x !== modId),
      }));
      setModQty((q) => {
        const n = { ...q };
        delete n[modId];
        return n;
      });
    } else {
      if (groupUnits(g) >= g.maxSelect) return;
      setChoices((c) => ({ ...c, [g.id]: [...(c[g.id] ?? []), modId] }));
    }
  }
  const modalValid =
    !modalItem ||
    modalItem.groups.every(
      (g) => !g.single || (choices[g.id]?.length ?? 0) === 1,
    );
  const modalUnit = modalItem
    ? modalItem.priceCents +
      modalItem.groups.reduce((s, g) => {
        return (
          s +
          (choices[g.id] ?? []).reduce((gs, id) => {
            const m = g.modifiers.find((x) => x.id === id);
            const q = g.single ? 1 : modQty[id] ?? 1;
            return gs + (m?.priceDeltaCents ?? 0) * q;
          }, 0)
        );
      }, 0)
    : 0;
  function confirmModal() {
    if (!modalItem) return;
    const mods: ChosenModifier[] = [];
    for (const g of modalItem.groups) {
      for (const id of choices[g.id] ?? []) {
        const m = g.modifiers.find((x) => x.id === id);
        if (m)
          mods.push({
            id: m.id,
            name: m.name,
            delta: m.priceDeltaCents,
            qty: g.single ? 1 : modQty[id] ?? 1,
          });
      }
    }
    addLine(modalItem, mods);
    setModalItem(null);
  }

  function enviar() {
    setStatus(null);
    if (!tableId) {
      setStatus("Escolha a mesa.");
      return;
    }
    if (cart.length === 0) {
      setStatus("Adicione itens ao pedido.");
      return;
    }
    const items = cart.map((l) => ({
      menuItemId: l.itemId,
      qty: l.qty,
      modifierIds: l.modifiers.flatMap((m) => Array(m.qty).fill(m.id)),
    }));
    const name = customerName.trim();
    startTransition(async () => {
      const res = await createStaffOrder({
        tableId,
        customerName: name || undefined,
        items,
      });
      if (res.ok) {
        setCart([]);
        setCustomerName("");
        setStatus("Pedido enviado para a cozinha!");
        router.refresh();
      } else {
        setStatus(res.error);
      }
    });
  }

  const cobrar = useCallback(
    (orderId: string) =>
      startTransition(async () => {
        await markPaid(orderId);
        router.refresh();
      }),
    [router],
  );
  const atender = useCallback(
    (callId: string) =>
      startTransition(async () => {
        await resolveWaiterCall(callId);
        router.refresh();
      }),
    [router],
  );

  const paymentsTotal = useMemo(
    () => payments.reduce((s, p) => s + p.totalCents, 0),
    [payments],
  );

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-3 text-xl font-medium text-ink">Atendimento</h1>

      {/* Abas */}
      <div className="mb-4 flex gap-1 rounded-full bg-surface-2 p-1 text-sm">
        <TabBtn active={tab === "pedido"} onClick={() => setTab("pedido")}>
          Pedido
        </TabBtn>
        <TabBtn active={tab === "chamadas"} onClick={() => setTab("chamadas")}>
          Chamadas{calls.length > 0 && <Badge>{calls.length}</Badge>}
        </TabBtn>
        <TabBtn
          active={tab === "pagamentos"}
          onClick={() => setTab("pagamentos")}
        >
          Pagamentos{payments.length > 0 && <Badge>{payments.length}</Badge>}
        </TabBtn>
      </div>

      {status && (
        <p className="mb-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink">
          {status}
        </p>
      )}

      {/* ---------- PEDIDO ---------- */}
      {tab === "pedido" && (
        <div>
          <p className="mb-1 text-sm font-medium text-muted">Mesa</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setTableId(t.id)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  tableId === t.id
                    ? "border-brand bg-brand text-brand-ink"
                    : "border-line bg-surface text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
            {tables.length === 0 && (
              <span className="text-sm text-muted">
                Sem mesas. Crie mesas em Gestão → Mesas.
              </span>
            )}
          </div>

          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nome do cliente (opcional)"
            className="mb-4 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted"
          />

          {menu.map((cat) => (
            <section key={cat.id} className="mb-5">
              <h2 className="mb-2 text-base font-semibold text-ink">
                {cat.name}
              </h2>
              <ul className="space-y-2">
                {cat.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="text-sm text-muted">
                        {formatMoney(item.priceCents)}
                        {item.groups.length > 0 && " · opções"}
                      </p>
                    </div>
                    <button
                      onClick={() => onAddClick(item)}
                      disabled={!item.available}
                      className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-ink disabled:bg-surface-2 disabled:text-muted"
                    >
                      +
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* ---------- CHAMADAS ---------- */}
      {tab === "chamadas" && (
        <div className="space-y-2">
          {calls.length === 0 && (
            <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
              Nenhuma mesa a chamar. 🎉
            </p>
          )}
          {calls.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-line bg-surface p-3"
            >
              <div>
                <p className="font-medium text-ink">Mesa {c.tableLabel}</p>
                <p className="text-xs text-muted">
                  chamou o garçom · {minutesAgo(c.createdAt)}
                </p>
              </div>
              <button
                onClick={() => atender(c.id)}
                disabled={pending}
                className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-ink disabled:opacity-50"
              >
                Atender
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---------- PAGAMENTOS ---------- */}
      {tab === "pagamentos" && (
        <div className="space-y-2">
          {payments.length === 0 && (
            <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
              Nenhum pagamento em aberto.
            </p>
          )}
          {payments.length > 0 && (
            <p className="text-sm text-muted">
              {payments.length} em aberto · total {formatMoney(paymentsTotal)}
            </p>
          )}
          {payments.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-line bg-surface p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    Mesa {p.tableLabel}
                    {p.customerName && (
                      <span className="text-muted"> · {p.customerName}</span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {p.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-ink">
                    {formatMoney(p.totalCents)}
                  </p>
                  <button
                    onClick={() => cobrar(p.id)}
                    disabled={pending}
                    className="mt-1 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-ink disabled:opacity-50"
                  >
                    Cobrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Carrinho fixo (aba Pedido) ---------- */}
      {tab === "pedido" && cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface p-4 shadow-[var(--shadow-bar)]">
          <div className="mx-auto max-w-2xl space-y-2">
            <ul className="max-h-32 space-y-1.5 overflow-y-auto">
              {cart.map((l) => (
                <li key={l.key} className="flex items-center gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ink">{l.name}</p>
                    {l.modifiers.length > 0 && (
                      <p className="truncate text-xs text-muted">
                        {l.modifiers.map(modLabel).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-line px-1">
                    <button
                      onClick={() => changeQty(l.key, -1)}
                      className="h-6 w-6 text-ink"
                    >
                      −
                    </button>
                    <span className="w-4 text-center font-semibold text-ink">
                      {l.qty}
                    </span>
                    <button
                      onClick={() => changeQty(l.key, 1)}
                      className="h-6 w-6 text-ink"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-16 text-right text-ink">
                    {formatMoney(lineUnit(l) * l.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={enviar}
              disabled={pending || !tableId}
              className="flex w-full items-center justify-between rounded-full bg-brand px-5 py-3 font-semibold text-brand-ink disabled:bg-surface-2 disabled:text-muted"
            >
              <span>
                {pending
                  ? "Enviando…"
                  : tableId
                    ? "Enviar para a cozinha"
                    : "Escolha a mesa"}
              </span>
              <span>
                {cartCount} · {formatMoney(cartTotal)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ---------- Modal de opções ---------- */}
      {modalItem && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40"
          onClick={() => setModalItem(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-ink">{modalItem.name}</h3>
            {modalItem.groups.map((g) => (
              <div key={g.id} className="mt-4">
                <p className="mb-2 text-sm font-semibold text-ink">
                  {g.name}{" "}
                  <span className="text-xs font-normal text-muted">
                    {g.single ? "(escolha 1)" : "(opcional)"}
                  </span>
                </p>
                <ul className="space-y-2">
                  {g.modifiers.map((m) => {
                    const picked = (choices[g.id] ?? []).includes(m.id);
                    const q = modQty[m.id] ?? 1;
                    return (
                      <li key={m.id}>
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                            picked
                              ? "border-brand bg-brand-weak"
                              : "border-line bg-surface"
                          }`}
                        >
                          <input
                            type={g.single ? "radio" : "checkbox"}
                            name={g.id}
                            checked={picked}
                            onChange={() => toggleChoice(g, m.id)}
                            className="h-4 w-4 accent-brand"
                          />
                          <span className="flex-1 text-ink">{m.name}</span>
                          {m.priceDeltaCents > 0 && (
                            <span className="text-muted">
                              +{formatMoney(m.priceDeltaCents)}
                            </span>
                          )}
                          {picked && !g.single && g.maxSelect > 1 && (
                            <span
                              className="flex items-center gap-1"
                              onClick={(e) => e.preventDefault()}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  bumpModQty(g, m.id, -1);
                                }}
                                disabled={q <= 1}
                                className="h-6 w-6 rounded-full text-ink disabled:opacity-30"
                              >
                                −
                              </button>
                              <span className="w-4 text-center font-semibold text-ink">
                                {q}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  bumpModQty(g, m.id, 1);
                                }}
                                disabled={groupUnits(g) >= g.maxSelect}
                                className="h-6 w-6 rounded-full text-ink disabled:opacity-30"
                              >
                                +
                              </button>
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setModalItem(null)}
                className="rounded-full border border-line px-5 py-2.5 text-sm text-ink"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal}
                disabled={!modalValid}
                className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-brand-ink disabled:bg-surface-2 disabled:text-muted"
              >
                {modalValid
                  ? `Adicionar · ${formatMoney(modalUnit)}`
                  : "Escolha as opções"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 font-medium transition ${
        active ? "bg-surface text-ink shadow-sm" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-ink">
      {children}
    </span>
  );
}
