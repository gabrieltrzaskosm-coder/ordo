"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
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

// Colunas do board = estados operacionais da cozinha. `served` (entregue) sai do
// board: se estiver por pagar cai na faixa "por pagar"; se pago, a mesa zera e
// desaparece. `critAfter` (segundos desde a criação do pedido) é o limite a
// partir do qual o card entra em estado "atrasado" (tempo a vermelho + pulsar).
type BoardStatus = "placed" | "in_prep" | "ready";

const STATUS: Record<
  BoardStatus,
  { label: string; color: string; shadow: string; next: string; critAfter: number }
> = {
  placed: {
    label: "Na fila",
    color: "#f97316",
    shadow: "rgba(249,115,22,.35)",
    next: "INICIAR PREPARO",
    critAfter: 600,
  },
  in_prep: {
    label: "Em preparo",
    color: "#2563eb",
    shadow: "rgba(37,99,235,.35)",
    next: "MARCAR PRONTO",
    critAfter: 1800,
  },
  ready: {
    label: "Pronto",
    color: "#059669",
    shadow: "rgba(5,150,105,.35)",
    next: "ENTREGAR",
    critAfter: 300,
  },
};

const BOARD_ORDER: BoardStatus[] = ["placed", "in_prep", "ready"];

const AMBER_PARTICLES = [
  "#f59e0b",
  "#fbbf24",
  "#f59e0b",
  "#f97316",
  "#f59e0b",
  "#fbbf24",
];
const RED_PARTICLES = [
  "#e11d48",
  "#f43f5e",
  "#e11d48",
  "#fb7185",
  "#e11d48",
  "#f43f5e",
];

// tableLabel pode vir como "Mesa 12" ou só "12"; no card gigante queremos o
// número. Extrai o número final; se não houver, mostra a etiqueta como está.
function tableNumber(label: string): string {
  const m = label.match(/(\d+)\s*$/);
  return m ? m[1] : label;
}

export function KitchenBoard({
  orders,
  calls,
  establishmentId,
  establishmentName,
}: {
  orders: KitchenOrder[];
  calls: WaiterCall[];
  establishmentId: string;
  establishmentName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [live, setLive] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  // Relógio/tempos ao vivo. `null` até montar para não divergir do HTML do
  // servidor (o relógio do server ≠ do cliente causaria erro de hidratação).
  const [now, setNow] = useState<number | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);

  // Alerta sonoro dos pedidos novos por pagar. O browser bloqueia áudio até um
  // gesto do utilizador, por isso o som é opt-in (botão) e a preferência fica
  // guardada. Refs para o AudioContext e para ler o estado sem re-subscrever.
  const soundOnRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Ids já vistos no ecrã: distingue um pedido acabado de chegar de um refresh
  // qualquer. `null` = ainda não semeámos (primeira renderização).
  const seenIds = useRef<Set<string> | null>(null);

  // Relógio: um tick por segundo alimenta o relógio do header e os tempos dos
  // cards. Só arranca no cliente (ver nota do `now`).
  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Primeiro valor logo após montar, mas num callback (não no corpo síncrono
    // do efeito) — evita render em cascata; daí em diante, um tick por segundo.
    const raf = requestAnimationFrame(tick);
    const t = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    // Lê a preferência após montar, num callback — evita render em cascata e
    // mantém o 1.º render do cliente igual ao do servidor (som sempre off).
    const raf = requestAnimationFrame(() => {
      if (localStorage.getItem("cozinha:som") === "on") {
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
      // Sem áudio disponível: o alerta visual continua a funcionar.
    }
  }, []);

  // Toca só quando um pedido NOVO por pagar aparece (id inédito, em `placed` e
  // não pago), não a cada refresh do Realtime.
  useEffect(() => {
    const currentIds = orders.map((o) => o.id);
    if (seenIds.current === null) {
      seenIds.current = new Set(currentIds);
      return;
    }
    const fresh = orders.some(
      (o) => o.status === "placed" && !o.paid && !seenIds.current!.has(o.id),
    );
    seenIds.current = new Set(currentIds);
    if (fresh) playDing();
  }, [orders, playDing]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    soundOnRef.current = next;
    localStorage.setItem("cozinha:som", next ? "on" : "off");
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

  // Efeitos de rato: spotlight no board + glow/tilt 3D por card. Só reagem a
  // rato (num touchscreen ficam inertes) e não alteram dados — puro enfeite.
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const onMove = (e: MouseEvent) => {
      const br = board.getBoundingClientRect();
      board.style.setProperty("--spot-x", `${e.clientX - br.left}px`);
      board.style.setProperty("--spot-y", `${e.clientY - br.top}px`);
      board.querySelectorAll<HTMLElement>(".kds-card").forEach((card) => {
        const r = card.getBoundingClientRect();
        const cx = e.clientX - r.left;
        const cy = e.clientY - r.top;
        const inside = cx >= 0 && cy >= 0 && cx <= r.width && cy <= r.height;
        const near =
          e.clientX > r.left - 160 &&
          e.clientX < r.right + 160 &&
          e.clientY > r.top - 160 &&
          e.clientY < r.bottom + 160;
        card.style.setProperty("--gx", `${cx}px`);
        card.style.setProperty("--gy", `${cy}px`);
        card.style.setProperty(
          "--glowc",
          card.dataset.glowc || "rgba(37,99,235,.5)",
        );
        card.style.setProperty("--glow", near ? (inside ? "1" : "0.5") : "0");
        if (inside) {
          const rx = (cy / r.height - 0.5) * -6;
          const ry = (cx / r.width - 0.5) * 6;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
          card.style.zIndex = "20";
        } else {
          card.style.transform = "";
          card.style.zIndex = "";
        }
      });
    };

    const onLeave = () => {
      board.style.setProperty("--spot-x", "-999px");
      board.querySelectorAll<HTMLElement>(".kds-card").forEach((c) => {
        c.style.setProperty("--glow", "0");
        c.style.transform = "";
        c.style.zIndex = "";
      });
    };

    board.addEventListener("mousemove", onMove);
    board.addEventListener("mouseleave", onLeave);
    return () => {
      board.removeEventListener("mousemove", onMove);
      board.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  function ageSec(iso: string): number | null {
    return now === null
      ? null
      : Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  }

  // Pedidos entregues mas ainda por cobrar: risco de a mesa sair sem pagar.
  const unpaidServed = orders
    .filter((o) => o.status === "served" && !o.paid)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const stats = [
    { label: "Na fila", sub: "aguardando", color: "#f97316", value: count(orders, "placed") },
    { label: "Em preparo", sub: "na chapa", color: "#2563eb", value: count(orders, "in_prep") },
    { label: "Prontos", sub: "para entregar", color: "#059669", value: count(orders, "ready") },
    { label: "A pagar", sub: "entregues", color: "#f59e0b", value: unpaidServed.length },
  ];

  const clock =
    now === null
      ? "··:··:··"
      : new Date(now).toLocaleTimeString("pt-BR", { hour12: false });

  return (
    <main
      className="kds theme-kitchen"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#eef1f6,#e6eaf2)",
        color: "#0f172a",
        padding: "22px 26px 30px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <header
        style={{ display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#2563eb",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 8px 22px rgba(37,99,235,.35)",
            }}
          >
            <span
              className="kds-cond"
              style={{ fontWeight: 700, fontSize: 26, color: "#fff", letterSpacing: ".5px" }}
            >
              KD
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span
              className="kds-cond"
              style={{ fontWeight: 700, fontSize: 30, lineHeight: 1, letterSpacing: ".5px" }}
            >
              COZINHA · KDS
            </span>
            <span style={{ fontWeight: 500, fontSize: 15, color: "#64748b", marginTop: 4 }}>
              {establishmentName}
            </span>
          </div>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={toggleSound}
            aria-pressed={soundOn}
            title={soundOn ? "Silenciar alerta sonoro" : "Ativar alerta sonoro"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: "1px solid #e2e8f0",
              padding: "10px 16px",
              borderRadius: 12,
              boxShadow: "0 2px 6px rgba(15,23,42,.05)",
              color: soundOn ? "#2563eb" : "#94a3b8",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: ".4px",
            }}
          >
            {soundOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
            {soundOn ? "SOM" : "MUDO"}
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: "#fff",
              border: "1px solid #e2e8f0",
              padding: "10px 16px",
              borderRadius: 12,
              boxShadow: "0 2px 6px rgba(15,23,42,.05)",
            }}
          >
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: live ? "#10b981" : "#94a3b8",
                boxShadow: live ? "0 0 0 4px rgba(16,185,129,.18)" : "none",
                animation: live ? "kdsBlink 1.6s infinite" : "none",
              }}
            />
            <span style={{ fontWeight: 600, fontSize: 15, color: "#334155", letterSpacing: ".4px" }}>
              {live ? "AO VIVO" : "A LIGAR…"}
            </span>
          </div>
          <div
            className="kds-cond tnum"
            style={{
              background: "#0f172a",
              color: "#fff",
              padding: "8px 18px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 32,
              lineHeight: 1,
              letterSpacing: "1px",
            }}
          >
            {clock}
          </div>
        </div>
      </header>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              minWidth: 170,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderLeft: `6px solid ${s.color}`,
              borderRadius: 14,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 8px rgba(15,23,42,.05)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 6 }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#64748b",
                  letterSpacing: ".6px",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </span>
              <span style={{ fontWeight: 500, fontSize: 13, color: "#94a3b8" }}>{s.sub}</span>
            </div>
            <span
              className="kds-cond tnum"
              style={{ fontWeight: 700, fontSize: 46, lineHeight: 1, color: s.color }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {unpaidServed.length > 0 && (
        <section
          style={{
            background: "linear-gradient(90deg,rgba(245,158,11,.12),rgba(245,158,11,.03))",
            border: "1px solid rgba(245,158,11,.35)",
            borderRadius: 16,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#f59e0b",
                animation: "kdsBlink 1.2s infinite",
              }}
            />
            <span
              className="kds-cond"
              style={{ fontWeight: 700, fontSize: 20, color: "#b45309", letterSpacing: ".6px" }}
            >
              ENTREGUES · POR PAGAR
            </span>
            <span
              className="kds-cond"
              style={{
                fontWeight: 700,
                fontSize: 16,
                background: "#f59e0b",
                color: "#fff",
                padding: "2px 12px",
                borderRadius: 20,
              }}
            >
              {unpaidServed.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {unpaidServed.map((o) => (
              <div
                key={o.id}
                className="kds-card"
                data-glowc="rgba(245,158,11,.5)"
                style={{
                  flex: "none",
                  width: 290,
                  borderRadius: 16,
                  background: "#fff",
                  border: "2px solid #f59e0b",
                  padding: "16px 18px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: ".6px",
                    }}
                  >
                    Mesa
                  </span>
                  <span
                    className="kds-cond"
                    style={{ fontWeight: 700, fontSize: 42, lineHeight: 1, color: "#b45309" }}
                  >
                    {tableNumber(o.tableLabel)}
                  </span>
                  <span
                    className="kds-cond tnum"
                    style={{ marginLeft: "auto", fontWeight: 700, fontSize: 18, color: "#c2410c" }}
                  >
                    {fmt(ageSec(o.createdAt))}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="kds-cond tnum" style={{ fontWeight: 700, fontSize: 24, color: "#0f172a" }}>
                    {formatMoney(o.totalCents)}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: "#64748b" }}>
                    👤 {o.customerName ?? "sem nome"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 9 }}>
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await markPaid(o.id);
                      })
                    }
                    className="kds-cond"
                    style={{
                      flex: 1,
                      border: "none",
                      background: "#059669",
                      color: "#fff",
                      padding: 13,
                      borderRadius: 11,
                      fontWeight: 700,
                      fontSize: 19,
                      letterSpacing: ".6px",
                      cursor: "pointer",
                    }}
                  >
                    MARCAR PAGO
                  </button>
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await cancelOrder(o.id);
                      })
                    }
                    title="Cancelar"
                    className="kds-cond"
                    style={{
                      flex: "none",
                      width: 52,
                      border: "1px solid #fee2e2",
                      background: "#fef2f2",
                      color: "#e11d48",
                      borderRadius: 11,
                      fontWeight: 700,
                      fontSize: 22,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {calls.length > 0 && (
        <section
          style={{
            background: "linear-gradient(90deg,rgba(225,29,72,.1),rgba(225,29,72,.03))",
            border: "1px solid rgba(225,29,72,.3)",
            borderRadius: 16,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#e11d48",
                animation: "kdsBlink 1s infinite",
              }}
            />
            <span
              className="kds-cond"
              style={{ fontWeight: 700, fontSize: 20, color: "#be123c", letterSpacing: ".6px" }}
            >
              CHAMADAS DE GARÇOM
            </span>
            <span
              className="kds-cond"
              style={{
                fontWeight: 700,
                fontSize: 16,
                background: "#e11d48",
                color: "#fff",
                padding: "2px 12px",
                borderRadius: 20,
              }}
            >
              {calls.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {calls.map((c) => (
              <div
                key={c.id}
                className="kds-card"
                data-glowc="rgba(225,29,72,.5)"
                style={{
                  flex: "none",
                  width: 290,
                  borderRadius: 16,
                  background: "#fff",
                  border: "2px solid #e11d48",
                  padding: "16px 18px",
                  animation: "kdsPulse 1.8s infinite",
                  overflow: "hidden",
                }}
              >
                <Particles colors={RED_PARTICLES} />
                <div
                  style={{
                    position: "relative",
                    zIndex: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: ".6px",
                      }}
                    >
                      Mesa
                    </span>
                    <span
                      className="kds-cond"
                      style={{ fontWeight: 700, fontSize: 42, lineHeight: 1, color: "#be123c" }}
                    >
                      {tableNumber(c.tableLabel)}
                    </span>
                    <span
                      className="kds-cond tnum"
                      style={{ marginLeft: "auto", fontWeight: 700, fontSize: 18, color: "#e11d48" }}
                    >
                      {fmt(ageSec(c.createdAt))}
                    </span>
                  </div>
                  <span className="kds-cond" style={{ fontWeight: 600, fontSize: 22, color: "#0f172a" }}>
                    Chamou o garçom
                  </span>
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await resolveWaiterCall(c.id);
                      })
                    }
                    className="kds-cond"
                    style={{
                      width: "100%",
                      border: "none",
                      background: "#e11d48",
                      color: "#fff",
                      padding: 13,
                      borderRadius: 11,
                      fontWeight: 700,
                      fontSize: 19,
                      letterSpacing: ".6px",
                      cursor: "pointer",
                    }}
                  >
                    RESOLVER
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div
        className="kds-board"
        ref={boardRef}
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        {BOARD_ORDER.map((status) => {
          const meta = STATUS[status];
          const list = orders
            .filter((o) => o.status === status)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          return (
            <section
              key={status}
              style={{
                background: "rgba(255,255,255,.55)",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 340,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: meta.color }} />
                <span
                  className="kds-cond"
                  style={{ fontWeight: 700, fontSize: 22, letterSpacing: ".6px", color: "#0f172a" }}
                >
                  {meta.label.toUpperCase()}
                </span>
                <span
                  className="kds-cond"
                  style={{
                    marginLeft: "auto",
                    fontWeight: 700,
                    fontSize: 18,
                    background: meta.color,
                    color: "#fff",
                    minWidth: 34,
                    textAlign: "center",
                    padding: "2px 10px",
                    borderRadius: 20,
                  }}
                >
                  {list.length}
                </span>
              </div>

              <div
                className="kds-scroll"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  maxHeight: "66vh",
                  overflowY: "auto",
                  padding: 2,
                }}
              >
                {list.map((o) => {
                  const sec = ageSec(o.createdAt);
                  const critical = sec !== null && sec >= meta.critAfter;
                  return (
                    <article
                      key={o.id}
                      className="kds-card"
                      data-glowc={
                        critical ? "rgba(245,158,11,.55)" : "rgba(37,99,235,.5)"
                      }
                      style={{
                        flexShrink: 0,
                        borderRadius: 16,
                        background: "#fff",
                        // Só longhands por lado — nenhum shorthand (`border`,
                        // `borderColor`, `borderWidth`) para não conflitar com os
                        // valores por lado (o React descartaria a cor). Topo = cor
                        // do status; restantes = âmbar quando atrasado.
                        borderStyle: "solid",
                        borderTopWidth: 6,
                        borderRightWidth: 1,
                        borderBottomWidth: 1,
                        borderLeftWidth: 1,
                        borderTopColor: meta.color,
                        borderRightColor: critical
                          ? "rgba(245,158,11,.55)"
                          : "#e2e8f0",
                        borderBottomColor: critical
                          ? "rgba(245,158,11,.55)"
                          : "#e2e8f0",
                        borderLeftColor: critical
                          ? "rgba(245,158,11,.55)"
                          : "#e2e8f0",
                        boxShadow: "0 4px 14px rgba(15,23,42,.08)",
                        overflow: "hidden",
                        ...(critical
                          ? { animation: "kdsPulse 2s infinite" }
                          : {}),
                      }}
                    >
                      {critical && <Particles colors={AMBER_PARTICLES} />}
                      <div
                        style={{
                          position: "relative",
                          zIndex: 3,
                          padding: "16px 16px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 5 }}>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: "#94a3b8",
                                textTransform: "uppercase",
                                letterSpacing: ".7px",
                              }}
                            >
                              Mesa
                            </span>
                            <span
                              className="kds-cond"
                              style={{ fontWeight: 700, fontSize: 52, lineHeight: 0.85, color: "#0f172a" }}
                            >
                              {tableNumber(o.tableLabel)}
                            </span>
                          </div>
                          <div
                            style={{
                              marginLeft: "auto",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 7,
                            }}
                          >
                            <span
                              className="kds-cond"
                              style={{
                                fontWeight: 700,
                                fontSize: 14,
                                letterSpacing: ".6px",
                                color: "#fff",
                                background: meta.color,
                                padding: "4px 12px",
                                borderRadius: 20,
                                textTransform: "uppercase",
                              }}
                            >
                              {meta.label}
                            </span>
                            <span
                              className="kds-cond tnum"
                              style={{
                                fontWeight: 700,
                                fontSize: 26,
                                lineHeight: 1,
                                color: critical ? "#e11d48" : "#475569",
                              }}
                            >
                              {fmt(sec)}
                            </span>
                            {critical && (
                              <span
                                className="kds-cond"
                                style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".8px", color: "#f59e0b" }}
                              >
                                ⚠ ATRASADO
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            borderTop: "1px dashed #e2e8f0",
                            paddingTop: 12,
                          }}
                        >
                          {o.items.map((it) => (
                            <div key={it.id} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                              <span
                                className="kds-cond tnum"
                                style={{ fontWeight: 700, fontSize: 30, lineHeight: 1, color: meta.color, minWidth: 52 }}
                              >
                                {it.qty}×
                              </span>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span
                                  className="kds-cond"
                                  style={{ fontWeight: 600, fontSize: 28, lineHeight: 1.05, color: "#0f172a" }}
                                >
                                  {it.name}
                                </span>
                                {it.modifiers.length > 0 && (
                                  <span style={{ fontWeight: 500, fontSize: 16, color: "#64748b" }}>
                                    {it.modifiers.join(", ")}
                                  </span>
                                )}
                                {it.notes && (
                                  <span style={{ fontWeight: 600, fontSize: 17, color: "#e11d48" }}>
                                    ↳ {it.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            borderTop: "1px solid #f1f5f9",
                            paddingTop: 12,
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: 16, color: "#64748b" }}>
                            👤 {o.customerName ?? "sem nome"}
                          </span>
                          <span
                            className="kds-cond tnum"
                            style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}
                          >
                            {formatMoney(o.totalCents)}
                          </span>
                          <span
                            className="kds-cond"
                            style={{
                              marginLeft: "auto",
                              fontWeight: 700,
                              fontSize: 14,
                              letterSpacing: ".5px",
                              padding: "3px 10px",
                              borderRadius: 8,
                              background: o.paid ? "#ecfdf5" : "#fff7ed",
                              color: o.paid ? "#059669" : "#c2410c",
                            }}
                          >
                            {o.paid ? "✓ PAGO" : "A PAGAR"}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: 9 }}>
                          <button
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await advanceOrder(o.id, status);
                              })
                            }
                            className="kds-cond"
                            style={{
                              flex: 1,
                              border: "none",
                              background: meta.color,
                              color: "#fff",
                              padding: "14px 10px",
                              borderRadius: 12,
                              fontWeight: 700,
                              fontSize: 20,
                              letterSpacing: ".5px",
                              cursor: "pointer",
                              boxShadow: `0 4px 12px ${meta.shadow}`,
                            }}
                          >
                            {meta.next}
                          </button>
                          {!o.paid && (
                            <button
                              disabled={pending}
                              onClick={() =>
                                startTransition(async () => {
                                  await markPaid(o.id);
                                })
                              }
                              title="Marcar pago"
                              style={{
                                flex: "none",
                                width: 52,
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                                borderRadius: 12,
                                fontSize: 22,
                                cursor: "pointer",
                              }}
                            >
                              💳
                            </button>
                          )}
                          <button
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await cancelOrder(o.id);
                              })
                            }
                            title="Cancelar"
                            className="kds-cond"
                            style={{
                              flex: "none",
                              width: 52,
                              border: "1px solid #fee2e2",
                              background: "#fef2f2",
                              color: "#e11d48",
                              borderRadius: 12,
                              fontWeight: 700,
                              fontSize: 22,
                              cursor: "pointer",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {list.length === 0 && (
                  <div
                    style={{
                      border: "2px dashed #dbe2ec",
                      borderRadius: 14,
                      padding: "34px 12px",
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: 17,
                      color: "#b0bccb",
                    }}
                  >
                    Sem pedidos
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

// Contagem de pedidos por status (para os stat tiles).
function count(orders: KitchenOrder[], status: OrderStatus): number {
  return orders.reduce((n, o) => (o.status === status ? n + 1 : n), 0);
}

// Segundos → "m:ss" (ou "··:··" antes de o relógio arrancar no cliente).
function fmt(sec: number | null): string {
  if (sec === null) return "··:··";
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function Particles({ colors }: { colors: string[] }) {
  return (
    <div className="kds-plyr" aria-hidden>
      {colors.map((c, i) => (
        <span key={i} className="kds-particle" style={{ "--pc": c } as CSSProperties} />
      ))}
    </div>
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m16 9 5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
