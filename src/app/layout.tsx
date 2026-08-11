import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Bricolage_Grotesque,
  Instrument_Serif,
  Manrope,
  Barlow,
  Barlow_Semi_Condensed,
  Sora,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonte de títulos (só a landing pública a usa, via `font-display`). Um
// grotesco de display com carácter — tira o ar de "Geist em tudo". Auto-alojada
// pelo next/font (servida de /_next), logo a CSP font-src 'self' já a cobre.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Tipografia da landing pública Ordo (só o componente OrdoLanding as usa): serifa
// de display + grotesca de texto. Auto-alojadas pelo next/font (/_next) → a CSP
// font-src 'self' cobre-as; não se carrega do CDN do Google (a CSP bloquearia).
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Tipografia do KDS da cozinha (só o KitchenBoard as usa, via .kds/.kds-cond):
// Barlow para corpo e a variante Semi Condensed para títulos e números grandes —
// legível de longe num ecrã de parede. Auto-alojadas pelo next/font (/_next), a
// CSP font-src 'self' cobre-as; não se carrega do CDN do Google (seria bloqueado).
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Semi_Condensed({
  variable: "--font-barlow-cond",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Tipografia do login (só a página /login as usa, via .ordo-login): Sora fina
// para o hero e JetBrains Mono para labels/nav/botão. preload:false — não são
// precisas no resto do app. Self-hosted pelo next/font → CSP font-src 'self'.
// Sora é fonte variável: sem `weight` carrega a variável completa (100–800) e
// usamos os pesos via CSS. Especificar pesos pedia instâncias estáticas que
// davam 404 no build.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Ordo — pedido e pagamento por QR, da Otium",
  description:
    "O cliente pede e paga à mesa por QR code (Pix, cartão, Apple Pay). Sem comissão: o dinheiro vai direto para o restaurante.",
};

export const viewport: Viewport = {
  themeColor: "#fbf9f7",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${instrumentSerif.variable} ${manrope.variable} ${barlow.variable} ${barlowCondensed.variable} ${sora.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
