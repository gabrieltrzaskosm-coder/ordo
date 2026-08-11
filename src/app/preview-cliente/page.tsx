// Demo pública — simulação do menu do cliente (o que ele vê ao ler o QR da
// mesa), com dados fictícios e sem sessão/BD (preview).
import { ClienteMenu } from "../(cliente)/mesa/[token]/ClienteMenu";
import type { MenuCategory } from "@/lib/menu";

export const dynamic = "force-dynamic";

const menu: MenuCategory[] = [
  {
    id: "cat1",
    name: "Entradas",
    items: [
      {
        id: "m1",
        name: "Bruschetta",
        description: "Pão italiano, tomate, manjericão e azeite.",
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
        description: "Seis unidades, com aioli de limão.",
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
        description: "Blend 180g, cheddar, picles e molho da casa.",
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
            ],
          },
        ],
      },
      {
        id: "m4",
        name: "Risoto de cogumelos",
        description: "Arbóreo, funghi secchi e parmesão.",
        priceCents: 4290,
        available: true,
        imageUrl: null,
        groups: [],
      },
      {
        id: "m5",
        name: "Pizza Margherita",
        description: "Molho de tomate, muçarela de búfala e manjericão.",
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
        description: "Feito na hora.",
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
  {
    id: "cat4",
    name: "Sobremesas",
    items: [
      {
        id: "m8",
        name: "Petit gâteau",
        description: "Com sorvete de creme.",
        priceCents: 2690,
        available: true,
        imageUrl: null,
        groups: [],
      },
    ],
  },
];

export default function PreviewCliente() {
  return (
    <ClienteMenu
      token="demo"
      menu={menu}
      currency="BRL"
      bestSellerId="m3"
      preview
    />
  );
}
