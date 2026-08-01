"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { MenuCategory, MenuItem } from "@/lib/menu";
import { formatMoney } from "@/lib/money";
import {
  callWaiter,
  getOrderableItems,
  payForOrder,
  placeOrder,
} from "./actions";

// Converte "3", "3,50" ou "3.50" em cêntimos. Inválido ou negativo → 0.
function eurosToCents(raw: string): number {
  const n = parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

type ChosenModifier = { id: string; name: string; delta: number; qty: number };

type CartLine = {
  key: string;
  itemId: string;
  name: string;
  basePriceCents: number;
  qty: number;
  modifiers: ChosenModifier[];
};

// Chave determinística: mesmo item + mesmas opções (incl. quantidade de cada
// extra) = mesma linha (agrupa qty). "2× bacon" é linha distinta de "1× bacon".
function lineKey(itemId: string, mods: ChosenModifier[]) {
  return (
    itemId +
    "|" +
    mods
      .map((m) => `${m.id}x${m.qty}`)
      .sort()
      .join(",")
  );
}

function lineUnit(line: CartLine) {
  return (
    line.basePriceCents +
    line.modifiers.reduce((s, m) => s + m.delta * m.qty, 0)
  );
}

// Rótulo de um extra no carrinho/cozinha: "2× Bacon" ou só "Bacon".
function modLabel(m: { name: string; qty: number }) {
  return m.qty > 1 ? `${m.qty}× ${m.name}` : m.name;
}

const safeBottom = "pb-[calc(1rem+env(safe-area-inset-bottom))]";

export function ClienteMenu({
  token,
  menu,
  currency,
  bestSellerId = null,
}: {
  token: string;
  menu: MenuCategory[];
  currency: string;
  bestSellerId?: string | null;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [placedOrder, setPlacedOrder] = useState<{
    id: string;
    subtotalCents: number;
  } | null>(null);
  const [tipCents, setTipCents] = useState(0);
  const [tipCustom, setTipCustom] = useState(false);
  const [tipCustomValue, setTipCustomValue] = useState("");
  // Modal de opções: item a configurar + escolhas por grupo (ids das opções) +
  // quantidade escolhida de cada extra (modifierId -> qty, só grupos múltiplos).
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [modQty, setModQty] = useState<Record<string, number>>({});
  // O que ainda se pode pedir: pratos e extras (um extra some quando o seu
  // ingrediente esgota). null = ainda não consultámos; vale o que o servidor
  // mandou, que já vem filtrado.
  const [orderable, setOrderable] = useState<{
    items: Set<string>;
    modifiers: Set<string>;
  } | null>(null);

  const subtotal = cart.reduce((s, l) => s + lineUnit(l) * l.qty, 0);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  const refreshOrderable = useCallback(async () => {
    const o = await getOrderableItems(token);
    setOrderable({ items: new Set(o.items), modifiers: new Set(o.modifiers) });
  }, [token]);

  // O stock muda enquanto o cliente está no ecrã (outra mesa pediu o último).
  // Sem isto, ele só via o artigo/extra desaparecer ao recarregar a página.
  useEffect(() => {
    let alive = true;
    async function poll() {
      const o = await getOrderableItems(token);
      if (alive)
        setOrderable({ items: new Set(o.items), modifiers: new Set(o.modifiers) });
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [token]);

  // Tira de um item os extras que já não dão para fazer, e larga grupos que
  // ficaram sem opções — igual ao que o servidor faz em getMenu.
  const pruneItem = useCallback(
    (item: MenuItem, mods: Set<string>): MenuItem => ({
      ...item,
      groups: item.groups
        .map((g) => ({ ...g, modifiers: g.modifiers.filter((m) => mods.has(m.id)) }))
        .filter((g) => g.modifiers.length > 0),
    }),
    [],
  );

  // Menu efetivamente mostrado: sai o prato/extra que esgotou desde que a página
  // carregou.
  const visibleMenu = useMemo(() => {
    if (!orderable) return menu;
    return menu
      .map((c) => ({
        ...c,
        items: c.items
          .filter((i) => orderable.items.has(i.id))
          .map((i) => pruneItem(i, orderable.modifiers)),
      }))
      .filter((c) => c.items.length > 0);
  }, [menu, orderable, pruneItem]);

  // Uma linha do carrinho fica inválida se o prato saiu OU se um extra escolhido
  // deixou de estar disponível.
  const lineStillOk = useCallback(
    (l: CartLine, o: { items: Set<string>; modifiers: Set<string> }) =>
      o.items.has(l.itemId) && l.modifiers.every((m) => o.modifiers.has(m.id)),
    [],
  );

  // Se algo do carrinho esgotou entretanto, tira-o e avisa — mais honesto do
  // que deixar o cliente submeter e levar com um erro.
  useEffect(() => {
    if (!orderable) return;
    const gone = cart.filter((l) => !lineStillOk(l, orderable));
    if (gone.length === 0) return;
    const names = [...new Set(gone.map((l) => l.name))];
    setCart((c) => c.filter((l) => lineStillOk(l, orderable)));
    setStatus(
      names.length === 1
        ? `${names[0]} deixou de estar disponível e saiu do seu pedido.`
        : `${names.join(", ")} deixaram de estar disponíveis e saíram do seu pedido.`,
    );
  }, [orderable, cart, lineStillOk]);

  // O artigo pode esgotar com o modal de opções aberto.
  useEffect(() => {
    if (modalItem && orderable && !orderable.items.has(modalItem.id)) {
      setModalItem(null);
      setStatus(`${modalItem.name} esgotou agora mesmo.`);
    }
  }, [modalItem, orderable]);

  // Opções mostradas no modal, já sem os extras que esgotaram.
  const modalGroups = useMemo(() => {
    if (!modalItem) return [];
    if (!orderable) return modalItem.groups;
    return pruneItem(modalItem, orderable.modifiers).groups;
  }, [modalItem, orderable, pruneItem]);

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
    if (item.groups.length === 0) {
      addLine(item, []);
    } else {
      setChoices({});
      setModQty({});
      setModalItem(item);
    }
  }

  // Unidades já escolhidas num grupo (soma das quantidades dos extras marcados).
  function groupUnits(g: MenuItem["groups"][number]): number {
    const picked = choices[g.id] ?? [];
    return picked.reduce((s, id) => s + (modQty[id] ?? 1), 0);
  }

  // +/- na quantidade de um extra, travado entre 1 e o teto do grupo.
  function bumpModQty(g: MenuItem["groups"][number], id: string, delta: number) {
    setModQty((q) => {
      const cur = q[id] ?? 1;
      if (delta > 0 && groupUnits(g) >= g.maxSelect) return q; // grupo cheio
      return { ...q, [id]: Math.max(1, cur + delta) };
    });
  }

  function confirmModal() {
    if (!modalItem) return;
    const mods: ChosenModifier[] = [];
    for (const g of modalGroups) {
      const picked = choices[g.id] ?? [];
      for (const id of picked) {
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

  // Todos os grupos de escolha única precisam de exatamente uma opção.
  const modalValid =
    !modalItem ||
    modalGroups.every((g) => !g.single || (choices[g.id]?.length ?? 0) === 1);

  // Preço corrente no modal (base + extras escolhidos, cada um × a sua quantidade).
  const modalUnit = modalItem
    ? modalItem.priceCents +
      modalGroups.reduce((s, g) => {
        const picked = choices[g.id] ?? [];
        return (
          s +
          picked.reduce((gs, id) => {
            const m = g.modifiers.find((x) => x.id === id);
            const q = g.single ? 1 : modQty[id] ?? 1;
            return gs + (m?.priceDeltaCents ?? 0) * q;
          }, 0)
        );
      }, 0)
    : 0;

  function toggleChoice(g: MenuItem["groups"][number], modId: string) {
    if (g.single) {
      setChoices((c) => ({ ...c, [g.id]: [modId] }));
      return;
    }
    const cur = choices[g.id] ?? [];
    if (cur.includes(modId)) {
      setChoices((c) => ({ ...c, [g.id]: (c[g.id] ?? []).filter((x) => x !== modId) }));
      setModQty((q) => {
        const next = { ...q };
        delete next[modId];
        return next;
      });
    } else {
      // Não deixa marcar mais um extra se o grupo já atingiu o teto de unidades.
      if (groupUnits(g) >= g.maxSelect) return;
      setChoices((c) => ({ ...c, [g.id]: [...(c[g.id] ?? []), modId] }));
    }
  }

  function submit() {
    setStatus(null);
    const items = cart.map((l) => ({
      menuItemId: l.itemId,
      qty: l.qty,
      // Cada extra vai repetido pela sua quantidade: "2× bacon" = [bacon, bacon].
      // O servidor conta ocorrências para preço e stock — sem coluna nova.
      modifierIds: l.modifiers.flatMap((m) => Array(m.qty).fill(m.id)),
    }));
    const orderSubtotal = subtotal;
    startTransition(async () => {
      const res = await placeOrder({ token, customerName: name, items });
      if (res.ok) {
        setCart([]);
        setStatus("Pedido enviado para a cozinha!");
        setPlacedOrder({ id: res.orderId, subtotalCents: orderSubtotal });
      } else {
        setStatus(res.error);
        // Recusado provavelmente por stock: sincroniza já para o artigo sair do
        // ecrã, em vez de esperar pelo próximo ciclo do polling.
        void refreshOrderable();
      }
    });
  }

  function pay() {
    if (!placedOrder) return;
    setStatus(null);
    startTransition(async () => {
      const res = await payForOrder({ token, orderId: placedOrder.id, tipCents });
      if (res.ok) window.location.href = res.url;
      else setStatus(res.error);
    });
  }

  function chamar() {
    setStatus(null);
    startTransition(async () => {
      const res = await callWaiter(token);
      setStatus(res.ok ? "Garçom a caminho." : res.error);
    });
  }

  return (
    <div>
      <button
        onClick={chamar}
        disabled={pending}
        className="reveal mb-6 flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface py-2.5 text-sm font-medium text-ink transition hover:border-brand/40 active:scale-[0.99] disabled:opacity-50"
      >
        <BellIcon />
        Chamar garçom
      </button>

      {visibleMenu.length === 0 && (
        <div className="reveal rounded-2xl border border-dashed border-line py-12 text-center">
          <p className="text-sm text-muted">
            O menu ainda está a ser preparado. Volte daqui a pouco.
          </p>
        </div>
      )}

      {visibleMenu.map((cat, ci) => (
        <section
          key={cat.id}
          id={`cat-${cat.id}`}
          className="reveal mb-7 scroll-mt-28"
          style={{ animationDelay: `${ci * 70}ms` }}
        >
          <h2 className="mb-3 px-1 text-base font-semibold text-ink">
            {cat.name}
          </h2>
          <ul className="space-y-2.5">
            {cat.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-card)] transition-colors hover:border-brand/40"
              >
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-18 w-18 shrink-0 rounded-xl object-cover"
                    style={{ height: "4.5rem", width: "4.5rem" }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug text-ink">{item.name}</p>
                  {item.description && (
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="tnum text-sm font-semibold text-ink">
                      {formatMoney(item.priceCents, currency)}
                    </span>
                    {item.id === bestSellerId && (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                        ★ Mais pedido
                      </span>
                    )}
                    {item.groups.length > 0 && (
                      <span className="rounded-full bg-brand-weak px-2 py-0.5 text-[11px] font-medium text-brand-strong">
                        opções
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onAddClick(item)}
                  disabled={!item.available}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink shadow-sm transition active:scale-90 disabled:bg-surface-2 disabled:text-muted disabled:shadow-none"
                  aria-label={`Adicionar ${item.name}`}
                >
                  {item.available ? <PlusIcon /> : <span className="text-[10px] font-semibold">—</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {status && !placedOrder && count === 0 && (
        <p className="mb-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink">
          {status}
        </p>
      )}

      {/* ---------- Modal de opções ---------- */}
      {modalItem && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40"
          style={{ animation: "backdrop-in 0.2s ease" }}
          onClick={() => setModalItem(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface shadow-[var(--shadow-sheet)]"
            style={{ animation: "sheet-in 0.32s var(--ease-out-quint)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-center bg-surface pt-3">
              <span className="h-1.5 w-10 rounded-full bg-line" />
            </div>
            <div className="px-5 pb-4 pt-3">
              <h3 className="text-lg font-semibold text-ink">{modalItem.name}</h3>
              <p className="tnum mt-0.5 text-sm text-muted">
                {formatMoney(modalItem.priceCents, currency)}
              </p>

              {modalGroups.map((g) => (
                <div key={g.id} className="mt-5">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{g.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        g.single
                          ? "bg-brand-weak text-brand-strong"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {g.single ? "escolha 1" : "opcional"}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {g.modifiers.map((m) => {
                      const picked = (choices[g.id] ?? []).includes(m.id);
                      const q = modQty[m.id] ?? 1;
                      const groupFull = groupUnits(g) >= g.maxSelect;
                      return (
                        <li key={m.id}>
                          <label
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
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
                              <span className="tnum font-medium text-muted">
                                +{formatMoney(m.priceDeltaCents, currency)}
                              </span>
                            )}
                            {picked && !g.single && g.maxSelect > 1 && (
                              <span
                                className="flex items-center gap-1 rounded-full border border-line p-0.5"
                                onClick={(e) => e.preventDefault()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    bumpModQty(g, m.id, -1);
                                  }}
                                  disabled={q <= 1}
                                  className="flex h-6 w-6 items-center justify-center rounded-full text-ink transition active:scale-90 disabled:opacity-30"
                                  aria-label="Menos um"
                                >
                                  <MinusIcon />
                                </button>
                                <span className="tnum w-4 text-center text-sm font-semibold text-ink">
                                  {q}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    bumpModQty(g, m.id, 1);
                                  }}
                                  disabled={groupFull}
                                  className="flex h-6 w-6 items-center justify-center rounded-full text-ink transition active:scale-90 disabled:opacity-30"
                                  aria-label="Mais um"
                                >
                                  <MinusPlusIcon />
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
            </div>

            <div
              className={`sticky bottom-0 flex gap-2 border-t border-line bg-surface px-5 pt-3 ${safeBottom}`}
            >
              <button
                onClick={() => setModalItem(null)}
                className="rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal}
                disabled={!modalValid}
                className="tnum flex-1 rounded-full bg-brand py-3 text-sm font-semibold text-brand-ink transition active:scale-[0.98] disabled:bg-surface-2 disabled:text-muted"
              >
                {modalValid
                  ? `Adicionar · ${formatMoney(modalUnit, currency)}`
                  : "Escolha as opções"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Carrinho + envio ---------- */}
      {count > 0 && !placedOrder && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 pt-3 shadow-[var(--shadow-bar)] ${safeBottom}`}
        >
          <div className="mx-auto max-w-md space-y-3">
            <ul className="max-h-40 space-y-2.5 overflow-y-auto">
              {cart.map((l) => (
                <li key={l.key} className="flex items-center gap-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{l.name}</p>
                    {l.modifiers.length > 0 && (
                      <p className="truncate text-xs text-muted">
                        {l.modifiers.map(modLabel).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-line p-0.5">
                    <button
                      onClick={() => changeQty(l.key, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-ink transition active:scale-90"
                      aria-label="Remover um"
                    >
                      <MinusIcon />
                    </button>
                    <span className="tnum w-4 text-center text-sm font-semibold text-ink">
                      {l.qty}
                    </span>
                    <button
                      onClick={() => changeQty(l.key, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-ink transition active:scale-90"
                      aria-label="Adicionar um"
                    >
                      <MinusPlusIcon />
                    </button>
                  </div>
                  <span className="tnum w-16 text-right font-medium text-ink">
                    {formatMoney(lineUnit(l) * l.qty, currency)}
                  </span>
                </li>
              ))}
            </ul>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="O seu nome"
              className="w-full rounded-full border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
            />
            <button
              onClick={submit}
              disabled={pending || !name.trim()}
              className="tnum flex w-full items-center justify-between rounded-full bg-brand px-5 py-3.5 font-semibold text-brand-ink transition active:scale-[0.99] disabled:bg-surface-2 disabled:text-muted"
            >
              <span>{pending ? "Enviando…" : "Enviar pedido"}</span>
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-black/15 px-2 py-0.5 text-xs">
                  {count}
                </span>
                {formatMoney(subtotal, currency)}
              </span>
            </button>
          </div>
        </div>
      )}

      {placedOrder && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 pt-4 shadow-[var(--shadow-bar)] ${safeBottom}`}
        >
          <div className="mx-auto max-w-md space-y-3">
            {status && (
              <p className="rounded-xl bg-success-weak px-3 py-2 text-center text-sm font-medium text-success">
                {status}
              </p>
            )}
            <div>
              <p className="mb-2 text-sm font-medium text-ink">
                Adicionar gorjeta?
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Sem", cents: 0 },
                  { label: "R$ 2", cents: 200 },
                  { label: "R$ 5", cents: 500 },
                  { label: "R$ 10", cents: 1000 },
                ].map((opt) => {
                  const selected = !tipCustom && tipCents === opt.cents;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => {
                        setTipCustom(false);
                        setTipCents(opt.cents);
                      }}
                      className={`flex-1 rounded-full border py-2 text-sm font-medium transition active:scale-[0.97] ${
                        selected
                          ? "border-brand bg-brand text-brand-ink"
                          : "border-line bg-surface text-ink"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setTipCustom(true);
                    setTipCents(eurosToCents(tipCustomValue));
                  }}
                  className={`flex-1 rounded-full border py-2 text-sm font-medium transition active:scale-[0.97] ${
                    tipCustom
                      ? "border-brand bg-brand text-brand-ink"
                      : "border-line bg-surface text-ink"
                  }`}
                >
                  Outro
                </button>
              </div>
              {tipCustom && (
                <input
                  inputMode="decimal"
                  autoFocus
                  value={tipCustomValue}
                  onChange={(e) => {
                    setTipCustomValue(e.target.value);
                    setTipCents(eurosToCents(e.target.value));
                  }}
                  placeholder="Valor da gorjeta em R$"
                  className="mt-2 w-full rounded-full border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
                />
              )}
            </div>
            <button
              onClick={pay}
              disabled={pending}
              className="tnum w-full rounded-full bg-brand py-3.5 font-semibold text-brand-ink transition active:scale-[0.99] disabled:opacity-50"
            >
              {pending
                ? "A abrir pagamento…"
                : `Pagar ${formatMoney(placedOrder.subtotalCents + tipCents, currency)}`}
            </button>
            <button
              onClick={() => setPlacedOrder(null)}
              className="w-full py-1 text-center text-sm text-muted"
            >
              Pagar depois
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Ícones (inline, sem dependências) ---------- */

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// "+" pequeno para o stepper do carrinho.
function MinusPlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 6v12M6 12h12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
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
