// Demo pública — simulação do KDS da cozinha com dados fictícios (sem auth).
// Serve para rever o desenho do KitchenBoard sem uma sessão de staff real.
import {
  KitchenBoard,
  type KitchenOrder,
  type WaiterCall,
} from "../(staff)/cozinha/KitchenBoard";

export const dynamic = "force-dynamic";

// createdAt a `sec` segundos atrás — deixa exercitar o estado "ATRASADO".
const isoAgo = (sec: number) => new Date(Date.now() - sec * 1000).toISOString();

const orders: KitchenOrder[] = [
  {
    id: "1",
    tableLabel: "Mesa 12",
    customerName: "João",
    status: "placed",
    totalCents: 8400,
    createdAt: isoAgo(40),
    paid: false,
    items: [
      { id: "1a", name: "Burger Duplo", qty: 2, notes: "Ponto médio", modifiers: ["Bacon", "Cheddar"] },
      { id: "1b", name: "Batata Rústica", qty: 1, notes: null, modifiers: [] },
    ],
  },
  {
    id: "2",
    tableLabel: "Mesa 7",
    customerName: "Marina",
    status: "placed",
    totalCents: 5200,
    createdAt: isoAgo(700),
    paid: false,
    items: [{ id: "2a", name: "Risoto Funghi", qty: 1, notes: "Sem cebola", modifiers: [] }],
  },
  {
    id: "3",
    tableLabel: "Mesa 3",
    customerName: "Pedro",
    status: "in_prep",
    totalCents: 12800,
    createdAt: isoAgo(140),
    paid: true,
    items: [
      { id: "3a", name: "Ribeye 400g", qty: 1, notes: "Mal passado", modifiers: ["Molho à parte"] },
      { id: "3b", name: "Caesar Salad", qty: 1, notes: null, modifiers: [] },
    ],
  },
  {
    id: "4",
    tableLabel: "Mesa 18",
    customerName: null,
    status: "in_prep",
    totalCents: 6900,
    createdAt: isoAgo(2000),
    paid: false,
    items: [{ id: "4a", name: "Salmão Grelhado", qty: 2, notes: null, modifiers: [] }],
  },
  {
    id: "5",
    tableLabel: "Mesa 9",
    customerName: "Ana",
    status: "ready",
    totalCents: 3400,
    createdAt: isoAgo(30),
    paid: true,
    items: [{ id: "5a", name: "Poke Bowl", qty: 1, notes: "Sem gergelim", modifiers: [] }],
  },
  {
    id: "6",
    tableLabel: "Mesa 5",
    customerName: "Rafa",
    status: "ready",
    totalCents: 4700,
    createdAt: isoAgo(400),
    paid: false,
    items: [{ id: "6a", name: "Tacos (3)", qty: 1, notes: "Extra pimenta", modifiers: [] }],
  },
  {
    id: "7",
    tableLabel: "Mesa 2",
    customerName: "Bruno",
    status: "served",
    totalCents: 9100,
    createdAt: isoAgo(720),
    paid: false,
    items: [{ id: "7a", name: "Frango Parmegiana", qty: 2, notes: null, modifiers: [] }],
  },
  {
    id: "8",
    tableLabel: "Mesa 15",
    customerName: "Elisa",
    status: "served",
    totalCents: 2600,
    createdAt: isoAgo(300),
    paid: false,
    items: [{ id: "8a", name: "Milkshake", qty: 2, notes: null, modifiers: [] }],
  },
];

const calls: WaiterCall[] = [{ id: "c1", tableLabel: "Mesa 8", createdAt: isoAgo(22) }];

export default function PreviewCozinha() {
  return (
    <KitchenBoard
      orders={orders}
      calls={calls}
      establishmentId="demo"
      establishmentName="Trattoria Vermelha"
    />
  );
}
