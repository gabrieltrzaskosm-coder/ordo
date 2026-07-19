"use client";

import { useState, useTransition } from "react";
import type { MenuCategory, MenuItem } from "@/lib/menu";
import { formatMoney } from "@/lib/money";
import { callWaiter, payForOrder, placeOrder } from "./actions";

// Converte "3", "3,50" ou "3.50" em cêntimos. Inválido ou negativo → 0.
function eurosToCents(raw: string): number {
  const n = parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

type ChosenModifier = { id: string; name: string; delta: number };

type CartLine = {
  key: string;
  itemId: string;
  name: string;
  basePriceCents: number;
  qty: number;
  modifiers: ChosenModifier[];
};

// Chave determinística: mesmo item + mesmas opções = mesma linha (agrupa qty).
function lineKey(itemId: string, mods: ChosenModifier[]) {
  return itemId + "|" + mods.map((m) => m.id).sort().join(",");
}

function lineUnit(line: CartLine) {
  return line.basePriceCents + line.modifiers.reduce((s, m) => s + m.delta, 0);
}

export function ClienteMenu({
  token,
  menu,
  currency,
}: {
  token: string;
  menu: MenuCategory[];
  currency: string;
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
  // Modal de opções: item a configurar + escolhas por grupo (ids das opções).
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [choices, setChoices] = useState<Record<string, string[]>>({});

  const subtotal = cart.reduce((s, l) => s + lineUnit(l) * l.qty, 0);
  const count = cart.reduce((s, l) => s + l.qty, 0);

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
      setModalItem(item);
    }
  }

  function confirmModal() {
    if (!modalItem) return;
    const mods: ChosenModifier[] = [];
    for (const g of modalItem.groups) {
      const picked = choices[g.id] ?? [];
      for (const id of picked) {
        const m = g.modifiers.find((x) => x.id === id);
        if (m) mods.push({ id: m.id, name: m.name, delta: m.priceDeltaCents });
      }
    }
    addLine(modalItem, mods);
    setModalItem(null);
  }

  // Todos os grupos de escolha única precisam de exatamente uma opção.
  const modalValid =
    !modalItem ||
    modalItem.groups.every((g) => !g.single || (choices[g.id]?.length ?? 0) === 1);

  function toggleChoice(groupId: string, modId: string, single: boolean) {
    setChoices((c) => {
      if (single) return { ...c, [groupId]: [modId] };
      const cur = c[groupId] ?? [];
      return {
        ...c,
        [groupId]: cur.includes(modId)
          ? cur.filter((x) => x !== modId)
          : [...cur, modId],
      };
    });
  }

  function submit() {
    setStatus(null);
    const items = cart.map((l) => ({
      menuItemId: l.itemId,
      qty: l.qty,
      modifierIds: l.modifiers.map((m) => m.id),
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
      setStatus(res.ok ? "Atendente a caminho." : res.error);
    });
  }

  return (
    <div>
      <button
        onClick={chamar}
        disabled={pending}
        className="mb-4 w-full rounded-lg border border-neutral-300 py-2 text-sm"
      >
        Chamar atendente
      </button>

      {menu.map((cat) => (
        <section key={cat.id} className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-neutral-500">{cat.name}</h2>
          <ul className="space-y-2">
            {cat.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3"
              >
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="truncate text-sm text-neutral-500">
                      {item.description}
                    </p>
                  )}
                  <p className="text-sm">{formatMoney(item.priceCents, currency)}</p>
                  {item.groups.length > 0 && (
                    <p className="text-xs text-neutral-400">opções disponíveis</p>
                  )}
                </div>
                <button
                  onClick={() => onAddClick(item)}
                  disabled={!item.available}
                  className="h-8 w-8 shrink-0 rounded-full border disabled:opacity-40"
                  aria-label="Adicionar"
                >
                  +
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {status && (
        <p className="mb-3 rounded-lg bg-neutral-100 p-3 text-sm">{status}</p>
      )}

      {/* ---------- Modal de opções ---------- */}
      {modalItem && (
        <div className="fixed inset-0 z-10 flex items-end bg-black/40">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4">
            <div className="mx-auto max-w-md">
              <h3 className="mb-1 text-lg font-medium">{modalItem.name}</h3>
              <p className="mb-4 text-sm text-neutral-500">
                {formatMoney(modalItem.priceCents, currency)}
              </p>

              {modalItem.groups.map((g) => (
                <div key={g.id} className="mb-4">
                  <p className="mb-1 text-sm font-medium">
                    {g.name}{" "}
                    <span className="text-xs font-normal text-neutral-400">
                      {g.single ? "(escolha 1)" : "(opcional)"}
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {g.modifiers.map((m) => {
                      const picked = (choices[g.id] ?? []).includes(m.id);
                      return (
                        <li key={m.id}>
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 p-2 text-sm">
                            <input
                              type={g.single ? "radio" : "checkbox"}
                              name={g.id}
                              checked={picked}
                              onChange={() => toggleChoice(g.id, m.id, g.single)}
                            />
                            <span className="flex-1">{m.name}</span>
                            {m.priceDeltaCents > 0 && (
                              <span className="text-neutral-500">
                                +{formatMoney(m.priceDeltaCents, currency)}
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <div className="flex gap-2">
                <button
                  onClick={() => setModalItem(null)}
                  className="flex-1 rounded-lg border border-neutral-300 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmModal}
                  disabled={!modalValid}
                  className="flex-1 rounded-lg bg-black py-2 text-sm text-white disabled:opacity-40"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Carrinho + envio ---------- */}
      {count > 0 && !placedOrder && (
        <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4">
          <div className="mx-auto max-w-md space-y-2">
            <ul className="max-h-40 space-y-2 overflow-y-auto">
              {cart.map((l) => (
                <li key={l.key} className="flex items-center gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{l.name}</p>
                    {l.modifiers.length > 0 && (
                      <p className="truncate text-xs text-neutral-500">
                        {l.modifiers.map((m) => m.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => changeQty(l.key, -1)}
                    className="h-7 w-7 rounded-full border"
                    aria-label="Remover um"
                  >
                    −
                  </button>
                  <span className="w-4 text-center">{l.qty}</span>
                  <button
                    onClick={() => changeQty(l.key, 1)}
                    className="h-7 w-7 rounded-full border"
                    aria-label="Adicionar um"
                  >
                    +
                  </button>
                  <span className="w-16 text-right">
                    {formatMoney(lineUnit(l) * l.qty, currency)}
                  </span>
                </li>
              ))}
            </ul>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="O seu nome"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
            <button
              onClick={submit}
              disabled={pending || !name.trim()}
              className="w-full rounded-lg bg-black py-3 text-white disabled:opacity-40"
            >
              Enviar pedido · {count} item(s) · {formatMoney(subtotal, currency)}
            </button>
          </div>
        </div>
      )}

      {placedOrder && (
        <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4">
          <div className="mx-auto max-w-md space-y-3">
            <div>
              <p className="mb-2 text-sm text-neutral-500">Gorjeta</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Sem", cents: 0 },
                  { label: "1 €", cents: 100 },
                  { label: "5 €", cents: 500 },
                  { label: "10 €", cents: 1000 },
                ].map((opt) => {
                  const selected = !tipCustom && tipCents === opt.cents;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => {
                        setTipCustom(false);
                        setTipCents(opt.cents);
                      }}
                      className={`flex-1 rounded-lg border py-2 text-sm ${
                        selected
                          ? "border-black bg-black text-white"
                          : "border-neutral-300"
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
                  className={`flex-1 rounded-lg border py-2 text-sm ${
                    tipCustom
                      ? "border-black bg-black text-white"
                      : "border-neutral-300"
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
                  placeholder="Valor da gorjeta em €"
                  className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              )}
            </div>
            <button
              onClick={pay}
              disabled={pending}
              className="w-full rounded-lg bg-black py-3 text-white disabled:opacity-40"
            >
              Pagar {formatMoney(placedOrder.subtotalCents + tipCents, currency)}
            </button>
            <button
              onClick={() => setPlacedOrder(null)}
              className="w-full py-1 text-center text-sm text-neutral-500"
            >
              Pagar depois
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
