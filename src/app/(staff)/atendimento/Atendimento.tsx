"use client";

// Aba do atendente (garçom): 3 painéis num só ecrã, com atualização em tempo real
//  1) Pedidos   — escolhe a mesa e monta o pedido (reusa o núcleo de criação);
//  2) Chamadas  — mesas que chamaram o garçom (notificação de "ir à mesa");
//  3) Contas    — pedidos em aberto e de que mesa são; botão para cobrar.
// O Realtime refaz os dados do servidor a cada mudança em orders/waiter_calls —
// por isso as chamadas e as contas aparecem sozinhas.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MenuCategory, MenuItem } from "@/lib/menu";
import { formatMoney } from "@/lib/money";
import { deliveryReadyNotification } from "@/lib/orders/delivery-notification";
import { createStaffOrder } from "./actions";
import { advanceOrder, markPaid, resolveWaiterCall } from "../cozinha/actions";

export type TableRow = { id: string; label: string };
export type OpenCall = { id: string; createdAt: string; tableLabel: string };
export type OpenPayment = {
  id: string;
  tableLabel: string;
  customerName: string | null;
  totalCents: number;
  status: string;
  paid: boolean;
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
  return itemId + "|" + mods.map((m) => `${m.id}x${m.qty}`).sort().join(",");
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
function onlyDigits(s: string) {
  const d = s.replace(/\D/g, "");
  return d || s;
}

type Tab = "pedido" | "chamadas" | "prontos" | "pagamentos";

export function Atendimento({
  establishmentId,
  menu,
  tables,
  calls,
  payments,
  onDeliver,
  onCharge,
}: {
  establishmentId: string;
  menu: MenuCategory[];
  tables: TableRow[];
  calls: OpenCall[];
  payments: OpenPayment[];
  // Opcionais: só o preview passa (para simular o "entregue"/"pago" sem auth).
  // No app real ficam undefined e usam-se os server actions.
  onDeliver?: (orderId: string) => void;
  onCharge?: (orderId: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Pedidos prontos = comida à espera de ser levada à mesa.
  const readyOrders = payments.filter((p) => p.status === "ready");
  const [tab, setTab] = useState<Tab>(
    calls.length > 0 ? "chamadas" : readyOrders.length > 0 ? "prontos" : "pedido",
  );
  const [live, setLive] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  // Alerta sonoro dos pedidos que ficam prontos. O browser bloqueia áudio até um
  // gesto do utilizador, por isso o som é opt-in (botão) e a preferência fica
  // guardada. Refs para o AudioContext e para ler o estado sem re-subscrever.
  const soundOnRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Ids de prontos já vistos: distingue um pedido acabado de ficar pronto de um
  // refresh qualquer. `null` = ainda não semeámos (primeira renderização).
  const seenReady = useRef<Set<string> | null>(null);

  // Toast efémero de confirmação e de pedido pronto.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    // Lê a preferência após montar, num callback — evita render em cascata e
    // mantém o 1.º render do cliente igual ao do servidor (som sempre off).
    const raf = requestAnimationFrame(() => {
      if (localStorage.getItem("atendimento:som") === "on") {
        setSoundOn(true);
        soundOnRef.current = true;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const playDing = useCallback(() => {
    if (!soundOnRef.current) return;
    try {
      const ctx =
        audioCtxRef.current ?? (audioCtxRef.current = new AudioContext());
      if (ctx.state === "suspended") void ctx.resume();
      ding(ctx);
    } catch {
      // Sem áudio disponível: o badge/realce continua a funcionar.
    }
  }, []);

  // O aviso chega quando a cozinha muda o estado para `ready`, trazendo nome e
  // mesa para que o garçom entregue ao cliente correto. Pedidos já prontos no
  // carregamento inicial aparecem na aba Prontos, sem repetir alertas antigos.
  useEffect(() => {
    if (seenReady.current === null) {
      seenReady.current = new Set(readyOrders.map((p) => p.id));
      return;
    }
    const fresh = readyOrders.filter((p) => !seenReady.current!.has(p.id));
    seenReady.current = new Set(readyOrders.map((p) => p.id));
    if (fresh.length === 0) return;

    playDing();
    const order = fresh[0];
    showToast(deliveryReadyNotification(order.customerName, order.tableLabel));
  }, [readyOrders, playDing, showToast]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    soundOnRef.current = next;
    localStorage.setItem("atendimento:som", next ? "on" : "off");
    // Ativar é o gesto que desbloqueia o áudio; confirma com um ding.
    if (next) {
      try {
        const ctx =
          audioCtxRef.current ?? (audioCtxRef.current = new AudioContext());
        if (ctx.state === "suspended") void ctx.resume();
        ding(ctx);
      } catch {
        // ignora
      }
    }
  }

  // Realtime atualiza os dados; a notificação com nome é emitida acima apenas
  // quando a lista passa a conter um pedido `ready` novo.
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
        .subscribe((s) => setLive(s === "SUBSCRIBED"));
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router, establishmentId]);

  // ---------- Montar pedido ----------
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [modQty, setModQty] = useState<Record<string, number>>({});
  const [itemQty, setItemQty] = useState(1);

  const cartTotal = cart.reduce((s, l) => s + lineUnit(l) * l.qty, 0);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const activeTable = tables.find((t) => t.id === tableId) ?? null;

  function addLine(item: MenuItem, mods: ChosenModifier[], qty: number) {
    const key = lineKey(item.id, mods);
    setCart((c) => {
      const existing = c.find((l) => l.key === key);
      if (existing) {
        return c.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      }
      return [
        ...c,
        {
          key,
          itemId: item.id,
          name: item.name,
          basePriceCents: item.priceCents,
          qty,
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
    if (item.groups.length === 0) {
      addLine(item, [], 1);
      showToast("Adicionado ao pedido");
      return;
    }
    // Pré-seleciona a 1.ª opção dos grupos de escolha única (radio).
    const pre: Record<string, string[]> = {};
    for (const g of item.groups) {
      if (g.single && g.modifiers[0]) pre[g.id] = [g.modifiers[0].id];
    }
    setChoices(pre);
    setModQty({});
    setItemQty(1);
    setModalItem(item);
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
    addLine(modalItem, mods, itemQty);
    setModalItem(null);
    showToast("Adicionado ao pedido");
  }

  function enviar() {
    if (!tableId) {
      setTab("pedido");
      showToast("Escolha a mesa primeiro");
      return;
    }
    if (cart.length === 0) {
      showToast("Adicione itens ao pedido");
      return;
    }
    const items = cart.map((l) => ({
      menuItemId: l.itemId,
      qty: l.qty,
      modifierIds: l.modifiers.flatMap((m) => Array(m.qty).fill(m.id)),
    }));
    const name = customerName.trim();
    const label = activeTable?.label ?? "";
    startTransition(async () => {
      const res = await createStaffOrder({
        tableId,
        customerName: name || undefined,
        items,
      });
      if (res.ok) {
        setCart([]);
        setCartOpen(false);
        setCustomerName("");
        showToast(`Pedido enviado — ${label}`);
        router.refresh();
      } else {
        showToast(res.error);
      }
    });
  }

  const cobrar = useCallback(
    (orderId: string) => {
      if (onCharge) {
        onCharge(orderId);
        showToast("Pagamento confirmado");
        return;
      }
      startTransition(async () => {
        await markPaid(orderId);
        showToast("Pagamento confirmado");
        router.refresh();
      });
    },
    [router, showToast, onCharge],
  );
  const atender = useCallback(
    (callId: string) =>
      startTransition(async () => {
        await resolveWaiterCall(callId);
        showToast("Chamada atendida");
        router.refresh();
      }),
    [router, showToast],
  );
  const entregar = useCallback(
    (orderId: string) => {
      if (onDeliver) {
        onDeliver(orderId);
        showToast("Pedido entregue");
        return;
      }
      startTransition(async () => {
        await advanceOrder(orderId, "ready");
        showToast("Pedido entregue");
        router.refresh();
      });
    },
    [router, showToast, onDeliver],
  );

  // Contas com os prontos primeiro (é a ação mais urgente do garçom).
  const sortedPayments = [...payments].sort(
    (a, b) =>
      (a.status === "ready" ? 0 : 1) - (b.status === "ready" ? 0 : 1),
  );

  return (
    <main className="theme-kitchen relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-2xl flex-col px-4 pb-40">
      {/* header */}
      <header className="flex items-center justify-between gap-3 pt-4 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand shadow-[0_0_0_4px_var(--color-brand-weak)]" />
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Atendimento
            </h1>
          </div>
          <p className="ml-[18px] mt-0.5 text-[12.5px] font-medium text-muted">
            Salão · tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-pressed={soundOn}
            title={soundOn ? "Silenciar aviso de pronto" : "Ativar aviso de pronto"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition active:scale-95 ${
              soundOn
                ? "border-brand/30 bg-brand-weak text-brand-strong"
                : "border-line bg-surface text-muted"
            }`}
          >
            {soundOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
            {soundOn ? "Som" : "Mudo"}
          </button>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
              live
                ? "border-success/30 bg-success-weak text-success"
                : "border-line bg-surface text-muted"
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
      </header>

      {/* tabs */}
      <nav className="flex gap-1.5">
        <TabBtn active={tab === "pedido"} onClick={() => setTab("pedido")}>
          Pedidos
        </TabBtn>
        <TabBtn active={tab === "chamadas"} onClick={() => setTab("chamadas")}>
          Chamadas
          {calls.length > 0 && (
            <Badge active={tab === "chamadas"}>{calls.length}</Badge>
          )}
        </TabBtn>
        <TabBtn active={tab === "prontos"} onClick={() => setTab("prontos")}>
          Prontos
          {readyOrders.length > 0 && (
            <Badge active={tab === "prontos"}>{readyOrders.length}</Badge>
          )}
        </TabBtn>
        <TabBtn
          active={tab === "pagamentos"}
          onClick={() => setTab("pagamentos")}
        >
          Contas
          {payments.length > 0 && (
            <Badge active={tab === "pagamentos"}>{payments.length}</Badge>
          )}
        </TabBtn>
      </nav>

      {/* table strip (só em Pedidos) */}
      {tab === "pedido" && (
        <div className="pt-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.09em] text-muted">
            Mesa do pedido
          </p>
          {tables.length === 0 ? (
            <p className="text-sm text-muted">
              Sem mesas. Crie mesas em Gestão → Mesas.
            </p>
          ) : (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tables.map((t) => {
                const on = tableId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTableId(t.id)}
                    className={`tnum flex-none whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                      on
                        ? "border-brand bg-brand text-brand-ink shadow-[0_4px_12px_-4px_var(--color-brand)]"
                        : "border-line bg-surface text-ink"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* content */}
      <div className="flex-1 pt-4">
        {/* ---------- PEDIDOS ---------- */}
        {tab === "pedido" && (
          <div>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome do cliente (opcional)"
              className="mb-5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
            />

            {menu.map((cat) => (
              <section key={cat.id} className="mb-6">
                <h2 className="mb-2.5 ml-1.5 text-[13px] font-bold uppercase tracking-[0.05em] text-muted">
                  {cat.name}
                </h2>
                <div className="flex flex-col gap-2.5">
                  {cat.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onAddClick(item)}
                      disabled={!item.available}
                      className={`flex items-center gap-3 rounded-lg border border-line bg-surface p-3.5 text-left shadow-[var(--shadow-card)] transition active:scale-[0.99] ${
                        item.available ? "" : "cursor-not-allowed opacity-55"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-ink">
                            {item.name}
                          </span>
                          {!item.available && (
                            <span className="flex-none rounded-md bg-warn-weak px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warn">
                              Esgotado
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-muted">
                          {item.groups.length > 0
                            ? `Personalizável · ${item.groups.length} ${
                                item.groups.length > 1 ? "opções" : "opção"
                              }`
                            : "Toque para adicionar"}
                        </p>
                      </div>
                      <span className="tnum font-bold text-ink">
                        {formatMoney(item.priceCents)}
                      </span>
                      <span
                        className={`grid h-8 w-8 flex-none place-items-center rounded-[10px] ${
                          item.available
                            ? "bg-brand-weak text-brand-strong"
                            : "bg-surface-2 text-muted"
                        }`}
                      >
                        <PlusIcon />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ---------- CHAMADAS ---------- */}
        {tab === "chamadas" && (
          <div className="flex flex-col gap-3">
            {calls.length === 0 && (
              <div className="px-6 py-16 text-center text-muted">
                <div className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-full bg-success-weak">
                  <CheckIcon className="text-success" size={26} />
                </div>
                <p className="font-semibold text-ink">Tudo em dia</p>
                <p className="mt-1 text-sm">Nenhuma mesa aguardando.</p>
              </div>
            )}
            {calls.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3.5 shadow-[var(--shadow-card)] animate-[rise-in_0.3s_var(--ease-out-quint)]"
              >
                <span className="tnum grid h-11 w-11 flex-none place-items-center rounded-[13px] bg-brand-weak text-base font-bold text-brand-strong">
                  {onlyDigits(c.tableLabel)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{c.tableLabel}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                    <span className="text-[12.5px] text-muted">
                      Chamou o garçom · {minutesAgo(c.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => atender(c.id)}
                  disabled={pending}
                  className="flex flex-none items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_3px_10px_-2px_var(--color-brand)] transition active:scale-95 disabled:opacity-50"
                >
                  <CheckIcon size={14} />
                  Atender
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ---------- PRONTOS ---------- */}
        {tab === "prontos" && (
          <div className="flex flex-col gap-3">
            {readyOrders.length === 0 && (
              <div className="px-6 py-16 text-center text-muted">
                <div className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-full bg-success-weak">
                  <CheckIcon className="text-success" size={26} />
                </div>
                <p className="font-semibold text-ink">Nenhum pedido pronto</p>
                <p className="mt-1 text-sm">Os próximos pratos liberados pela cozinha aparecem aqui.</p>
              </div>
            )}
            {readyOrders.map((p) => (
              <article
                key={p.id}
                className="rounded-xl border border-success/40 bg-surface p-4 shadow-[var(--shadow-card)] ring-1 ring-success/15 animate-[rise-in_0.3s_var(--ease-out-quint)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-success">
                      Pronto para entregar
                    </p>
                    <p className="mt-1 truncate text-lg font-bold text-ink">
                      {p.customerName ?? "Cliente não informado"}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted">{p.tableLabel}</p>
                  </div>
                  <span className="rounded-full bg-success-weak px-2.5 py-1 text-xs font-bold text-success">
                    {p.paid ? "Pago" : "Por pagar"}
                  </span>
                </div>
                <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted">
                  {p.items.map((i) => `${i.qty}× ${i.name}`).join(" · ")}
                </p>
                <button
                  onClick={() => entregar(p.id)}
                  disabled={pending}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-brand-ink shadow-[0_4px_12px_-3px_var(--color-brand)] transition active:scale-[0.99] disabled:opacity-50"
                >
                  <CheckIcon size={16} />
                  Entregue
                </button>
              </article>
            ))}
          </div>
        )}

        {/* ---------- CONTAS ---------- */}
        {tab === "pagamentos" && (
          <div className="flex flex-col gap-3">
            {payments.length === 0 && (
              <div className="px-6 py-16 text-center text-muted">
                <p className="font-semibold text-ink">Nada pendente</p>
                <p className="mt-1 text-sm">
                  Pratos prontos e contas aparecem aqui.
                </p>
              </div>
            )}
            {sortedPayments.map((p) => {
              const ready = p.status === "ready";
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border bg-surface p-4 shadow-[var(--shadow-card)] animate-[rise-in_0.3s_var(--ease-out-quint)] ${
                    ready ? "border-success/40 ring-1 ring-success/15" : "border-line"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-ink">
                          {p.tableLabel}
                        </span>
                        {ready && (
                          <span className="rounded-md bg-success-weak px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-success">
                            Pronto p/ retirar
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-muted">
                        {p.customerName ?? "Sem nome informado"}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-lg font-bold text-ink">
                      {formatMoney(p.totalCents)}
                    </span>
                  </div>
                  <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted">
                    {p.items.map((i) => `${i.qty}× ${i.name}`).join(" · ")}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {ready && (
                      <button
                        onClick={() => entregar(p.id)}
                        disabled={pending}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-brand-ink shadow-[0_4px_12px_-3px_var(--color-brand)] transition active:scale-[0.99] disabled:opacity-50"
                      >
                        <CheckIcon size={16} />
                        Entregue
                      </button>
                    )}
                    {!p.paid && (
                      <button
                        onClick={() => cobrar(p.id)}
                        disabled={pending}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success py-3 text-sm font-semibold text-white shadow-[0_4px_12px_-3px_var(--color-success)] transition active:scale-[0.99] disabled:opacity-50"
                      >
                        <CheckIcon size={16} />
                        Marcar como pago
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------- Barra do carrinho (compacta) ---------- */}
      {tab === "pedido" && cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-canvas from-60% to-transparent px-4 pb-6 pt-4">
          <div className="mx-auto flex max-w-2xl items-center gap-3.5 rounded-xl border border-line bg-surface p-3 pl-4 shadow-[var(--shadow-bar)]">
            <button
              onClick={() => setCartOpen(true)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="text-xs font-medium text-muted">
                {cartCount} {cartCount === 1 ? "item" : "itens"}
                {activeTable ? ` · ${activeTable.label}` : ""} · rever
              </span>
              <span className="tnum block text-lg font-bold text-ink">
                {formatMoney(cartTotal)}
              </span>
            </button>
            <button
              onClick={enviar}
              disabled={pending || !tableId}
              className="flex flex-none items-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-brand-ink shadow-[0_6px_16px_-4px_var(--color-brand)] transition active:scale-95 disabled:bg-surface-2 disabled:text-muted disabled:shadow-none"
            >
              {pending ? "Enviando…" : tableId ? "Enviar pedido" : "Escolha a mesa"}
              {!pending && tableId && <ArrowIcon />}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Painel de revisão do carrinho ---------- */}
      {cartOpen && cart.length > 0 && (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-end bg-ink/40 animate-[backdrop-in_0.2s_var(--ease-out-quint)]"
          onClick={() => setCartOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full rounded-t-2xl bg-surface shadow-[var(--shadow-sheet)] animate-[sheet-in_0.36s_var(--ease-out-quint)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1.5">
              <span className="h-1.5 w-9 rounded-full bg-line" />
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 pb-3">
              <h3 className="text-lg font-bold text-ink">
                Seu pedido
                {activeTable && (
                  <span className="font-medium text-muted">
                    {" · "}
                    {activeTable.label}
                  </span>
                )}
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-line bg-surface-2 text-muted"
                aria-label="Fechar"
              >
                <CloseIcon />
              </button>
            </div>
            <ul className="max-h-[46vh] space-y-1 overflow-y-auto px-5 py-3">
              {cart.map((l) => (
                <li key={l.key} className="flex items-center gap-3 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {l.name}
                    </p>
                    {l.modifiers.length > 0 && (
                      <p className="truncate text-xs text-muted">
                        {l.modifiers.map(modLabel).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-none items-center gap-1 rounded-full border border-line bg-surface-2 p-0.5">
                    <button
                      onClick={() => changeQty(l.key, -1)}
                      className="grid h-7 w-7 place-items-center rounded-full text-ink"
                      aria-label="Menos"
                    >
                      −
                    </button>
                    <span className="tnum w-5 text-center text-sm font-bold text-ink">
                      {l.qty}
                    </span>
                    <button
                      onClick={() => changeQty(l.key, 1)}
                      className="grid h-7 w-7 place-items-center rounded-full text-ink"
                      aria-label="Mais"
                    >
                      +
                    </button>
                  </div>
                  <span className="tnum w-16 flex-none text-right text-sm font-semibold text-ink">
                    {formatMoney(lineUnit(l) * l.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 pb-8 pt-3.5">
              <button
                onClick={enviar}
                disabled={pending || !tableId}
                className="flex w-full items-center justify-between rounded-xl bg-brand px-5 py-3.5 font-semibold text-brand-ink shadow-[0_6px_16px_-4px_var(--color-brand)] transition active:scale-[0.99] disabled:bg-surface-2 disabled:text-muted disabled:shadow-none"
              >
                <span>
                  {pending
                    ? "Enviando…"
                    : tableId
                      ? "Enviar pedido"
                      : "Escolha a mesa"}
                </span>
                <span className="tnum">
                  {cartCount} · {formatMoney(cartTotal)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Modal de opções ---------- */}
      {modalItem && (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-end bg-ink/40 animate-[backdrop-in_0.2s_var(--ease-out-quint)]"
          onClick={() => setModalItem(null)}
        >
          <div
            className="flex max-h-[86vh] w-full flex-col rounded-t-2xl bg-surface shadow-[var(--shadow-sheet)] animate-[sheet-in_0.36s_var(--ease-out-quint)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1.5">
              <span className="h-1.5 w-9 rounded-full bg-line" />
            </div>
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 pb-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-ink">
                  {modalItem.name}
                </h3>
                <p className="tnum mt-1 text-sm font-semibold text-brand-strong">
                  {formatMoney(modalItem.priceCents)}
                </p>
              </div>
              <button
                onClick={() => setModalItem(null)}
                className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line bg-surface-2 text-muted"
                aria-label="Fechar"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {modalItem.groups.map((g) => (
                <section key={g.id} className="mt-4">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-ink">{g.name}</span>
                    <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                      {g.single ? "Escolha 1" : `Até ${g.maxSelect}`}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {g.modifiers.map((m) => {
                      const picked = (choices[g.id] ?? []).includes(m.id);
                      const full = !g.single && groupUnits(g) >= g.maxSelect;
                      const disabled = !picked && full;
                      const q = modQty[m.id] ?? 1;
                      return (
                        <button
                          key={m.id}
                          onClick={() => !disabled && toggleChoice(g, m.id)}
                          disabled={disabled}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                            picked
                              ? "border-brand bg-brand-weak"
                              : disabled
                                ? "cursor-not-allowed border-line bg-surface opacity-45"
                                : "border-line bg-surface"
                          }`}
                        >
                          <span
                            className={`grid h-[22px] w-[22px] flex-none place-items-center border ${
                              g.single ? "rounded-full" : "rounded-md"
                            } ${
                              picked
                                ? "border-brand bg-brand text-brand-ink"
                                : "border-line bg-surface-2 text-transparent"
                            }`}
                          >
                            <CheckIcon size={12} />
                          </span>
                          <span className="flex-1 text-sm font-medium text-ink">
                            {m.name}
                          </span>
                          {picked && !g.single && g.maxSelect > 1 && (
                            <span
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  bumpModQty(g, m.id, -1);
                                }}
                                disabled={q <= 1}
                                className="grid h-6 w-6 place-items-center rounded-full text-ink disabled:opacity-30"
                              >
                                −
                              </button>
                              <span className="tnum w-4 text-center text-sm font-bold text-ink">
                                {q}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  bumpModQty(g, m.id, 1);
                                }}
                                disabled={groupUnits(g) >= g.maxSelect}
                                className="grid h-6 w-6 place-items-center rounded-full text-ink disabled:opacity-30"
                              >
                                +
                              </button>
                            </span>
                          )}
                          {m.priceDeltaCents > 0 && (
                            <span className="tnum text-[13.5px] font-semibold text-muted">
                              +{formatMoney(m.priceDeltaCents)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="flex items-center gap-3.5 border-t border-line px-5 pb-8 pt-3.5">
              <div className="flex flex-none items-center gap-0.5 rounded-xl border border-line bg-surface-2 p-1">
                <button
                  onClick={() => setItemQty((q) => Math.max(1, q - 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-xl text-ink shadow-[var(--shadow-card)]"
                  aria-label="Menos"
                >
                  −
                </button>
                <span className="tnum w-8 text-center text-base font-bold text-ink">
                  {itemQty}
                </span>
                <button
                  onClick={() => setItemQty((q) => q + 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-xl text-ink shadow-[var(--shadow-card)]"
                  aria-label="Mais"
                >
                  +
                </button>
              </div>
              <button
                onClick={confirmModal}
                disabled={!modalValid}
                className="flex flex-1 items-center justify-between rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-brand-ink shadow-[0_6px_16px_-4px_var(--color-brand)] transition active:scale-[0.99] disabled:bg-surface-2 disabled:text-muted disabled:shadow-none"
              >
                <span>{modalValid ? "Adicionar" : "Escolha as opções"}</span>
                {modalValid && (
                  <span className="tnum">
                    {formatMoney(modalUnit * itemQty)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Balões de "prato pronto" (persistentes) ----------
          Um balão por pedido pronto, visível em qualquer aba. Não fecha
          sozinho: só desaparece quando alguém toca "Entregue" (avança
          ready → served) — e, via Realtime, some para todos os garçons. */}
      {readyOrders.length > 0 && (
        <div
          className="pointer-events-none fixed inset-x-0 z-30 flex flex-col items-center gap-2 px-4"
          style={{ bottom: tab === "pedido" && cartCount > 0 ? 108 : 20 }}
        >
          {readyOrders.length > 3 && (
            <span className="pointer-events-auto rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold text-white shadow-lg">
              +{readyOrders.length - 3} outros prontos
            </span>
          )}
          {readyOrders.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-success/30 bg-surface p-3.5 shadow-[0_14px_34px_-10px_rgba(0,0,0,.3)] animate-[rise-in_0.3s_var(--ease-out-quint)]"
            >
              <span className="absolute -bottom-1 left-8 h-2.5 w-2.5 rotate-45 rounded-[2px] border-b border-r border-success/30 bg-surface" />
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-success-weak">
                  <CheckIcon size={13} className="text-success" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-success">
                  Pronto para entregar
                </span>
                <span className="ml-auto text-base font-bold text-ink">
                  {p.tableLabel}
                </span>
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-ink">
                {p.customerName ?? "Cliente não informado"}
              </p>
              <p className="mt-1.5 truncate text-[12.5px] text-muted">
                {p.items.map((i) => `${i.qty}× ${i.name}`).join(" · ")}
              </p>
              <button
                onClick={() => entregar(p.id)}
                disabled={pending}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-ink shadow-[0_4px_12px_-3px_var(--color-brand)] transition active:scale-[0.99] disabled:opacity-50"
              >
                <CheckIcon size={15} />
                Entregue
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Toast ---------- */}
      {toast && (
        <div className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-4">
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,.5)] animate-[rise-in_0.3s_var(--ease-out-quint)]"
          >
            <span className="grid h-4 w-4 place-items-center rounded-full bg-success">
              <CheckIcon size={10} className="text-white" />
            </span>
            {toast}
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
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition ${
        active
          ? "border-brand bg-brand text-brand-ink shadow-[0_5px_14px_-5px_var(--color-brand)]"
          : "border-line bg-surface text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`tnum inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
        active ? "bg-white/25 text-white" : "bg-brand-weak text-brand-strong"
      }`}
    >
      {children}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path
        d="M7.5 2v11M2 7.5h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M2.5 7.2l3 3L11.5 4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 3l8 8M11 3l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h9M8.5 3.5L13 8l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// "Ding" de duas notas via Web Audio — sem ficheiro de áudio para carregar.
function ding(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.setValueAtTime(1320, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.55);
}

function SpeakerOnIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 5 6 9H3v6h3l5 4V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 5 6 9H3v6h3l5 4V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m16 9 5 6M21 9l-5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
