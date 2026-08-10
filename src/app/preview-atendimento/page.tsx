// Demo pública — simulação do hub do atendente com dados fictícios (sem auth).
// Serve para rever o desenho do Atendimento sem uma sessão de staff real.
import type {
  OpenCall,
  OpenPayment,
  TableRow,
} from "../(staff)/atendimento/Atendimento";
import type { MenuCategory } from "@/lib/menu";
import { DemoAtendimento } from "./DemoAtendimento";

export const dynamic = "force-dynamic";

const isoAgo = (sec: number) => new Date(Date.now() - sec * 1000).toISOString();

const tables: TableRow[] = Array.from({ length: 18 }, (_, i) => ({
  id: `t${i + 1}`,
  label: `Mesa ${String(i + 1).padStart(2, "0")}`,
}));

const menu: MenuCategory[] = [
  {
    id: "cat1",
    name: "Entradas",
    items: [
      {
        id: "m1",
        name: "Bruschetta",
        description: null,
        priceCents: 2490,
        available: true,
        imageUrl: null,
        groups: [
          {
            id: "g1",
            name: "Pão",
            single: true,
            maxSelect: 1,
            modifiers: [
              { id: "x1", name: "Italiano", priceDeltaCents: 0 },
              { id: "x2", name: "Integral", priceDeltaCents: 0 },
            ],
          },
        ],
      },
      {
        id: "m2",
        name: "Bolinho de bacalhau",
        description: null,
        priceCents: 3290,
        available: true,
        imageUrl: null,
        groups: [],
      },
    ],
  },
  {
    id: "cat2",
    name: "Principais",
    items: [
      {
        id: "m3",
        name: "Burger Ordo",
        description: null,
        priceCents: 3890,
        available: true,
        imageUrl: null,
        groups: [
          {
            id: "g2",
            name: "Ponto da carne",
            single: true,
            maxSelect: 1,
            modifiers: [
              { id: "y1", name: "Mal passado", priceDeltaCents: 0 },
              { id: "y2", name: "Ao ponto", priceDeltaCents: 0 },
              { id: "y3", name: "Bem passado", priceDeltaCents: 0 },
            ],
          },
          {
            id: "g3",
            name: "Adicionais",
            single: false,
            maxSelect: 3,
            modifiers: [
              { id: "z1", name: "Bacon", priceDeltaCents: 690 },
              { id: "z2", name: "Cheddar extra", priceDeltaCents: 490 },
              { id: "z3", name: "Ovo", priceDeltaCents: 390 },
              { id: "z4", name: "Cebola caramelizada", priceDeltaCents: 390 },
            ],
          },
        ],
      },
      {
        id: "m4",
        name: "Risoto de cogumelos",
        description: null,
        priceCents: 4290,
        available: true,
        imageUrl: null,
        groups: [],
      },
      {
        id: "m5",
        name: "Pizza Margherita",
        description: null,
        priceCents: 4590,
        available: false,
        imageUrl: null,
        groups: [],
      },
    ],
  },
  {
    id: "cat3",
    name: "Bebidas",
    items: [
      {
        id: "m6",
        name: "Chopp Pilsen 300ml",
        description: null,
        priceCents: 1690,
        available: true,
        imageUrl: null,
        groups: [],
      },
      {
        id: "m7",
        name: "Suco natural",
        description: null,
        priceCents: 1290,
        available: true,
        imageUrl: null,
        groups: [
          {
            id: "g4",
            name: "Sabor",
            single: true,
            maxSelect: 1,
            modifiers: [
              { id: "s1", name: "Laranja", priceDeltaCents: 0 },
              { id: "s2", name: "Abacaxi c/ hortelã", priceDeltaCents: 200 },
              { id: "s3", name: "Maracujá", priceDeltaCents: 200 },
            ],
          },
        ],
      },
    ],
  },
];

const calls: OpenCall[] = [
  { id: "c1", tableLabel: "Mesa 12", createdAt: isoAgo(120) },
  { id: "c2", tableLabel: "Mesa 04", createdAt: isoAgo(20) },
  { id: "c3", tableLabel: "Mesa 21", createdAt: isoAgo(360) },
];

const payments: OpenPayment[] = [
  // Pronto + por pagar → botões "Entregue" e "Marcar como pago".
  {
    id: "p1",
    tableLabel: "Mesa 07",
    customerName: "João",
    totalCents: 8760,
    status: "ready",
    paid: false,
    items: [
      { name: "Burger Ordo", qty: 2 },
      { name: "Chopp Pilsen 300ml", qty: 3 },
    ],
  },
  // Pronto + já pago → só "Entregue".
  {
    id: "p2",
    tableLabel: "Mesa 09",
    customerName: "Rafa",
    totalCents: 3380,
    status: "ready",
    paid: true,
    items: [{ name: "Poke Bowl", qty: 1 }],
  },
  // Em preparo + por pagar → só "Marcar como pago".
  {
    id: "p3",
    tableLabel: "Mesa 15",
    customerName: null,
    totalCents: 4290,
    status: "in_prep",
    paid: false,
    items: [
      { name: "Risoto de cogumelos", qty: 1 },
      { name: "Água", qty: 1 },
    ],
  },
  // Entregue + por pagar → só "Marcar como pago".
  {
    id: "p4",
    tableLabel: "Mesa 02",
    customerName: "Marina",
    totalCents: 12340,
    status: "served",
    paid: false,
    items: [
      { name: "Pizza Margherita", qty: 1 },
      { name: "Bruschetta", qty: 2 },
    ],
  },
];

export default function PreviewAtendimento() {
  return (
    <DemoAtendimento
      menu={menu}
      tables={tables}
      calls={calls}
      initialPayments={payments}
    />
  );
}
