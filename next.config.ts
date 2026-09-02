import type { NextConfig } from "next";

// Origem do Supabase, para a CSP deixar passar as chamadas de dados, as imagens
// do menu (bucket público) e o websocket do Realtime (cozinha). Derivada da env
// pública; fallback para o wildcard do Supabase se faltar no build.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "*.supabase.co";
// Fonte temporária das imagens do cardápio de teste. É mantida específica para
// não transformar a CSP em uma permissão genérica para CDNs externos.
const temporaryMenuImageHost = "leadsfood.nyc3.cdn.digitaloceanspaces.com";

const isDev = process.env.NODE_ENV === "development";

// Só abre a CSP para o Sentry quando ele está mesmo configurado (DSN pública
// presente no build). Sem Sentry, a CSP fica tão apertada como antes.
const sentryConnect = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? " https://*.sentry.io"
  : "";

// Content-Security-Policy. Sem nonce (não obriga a render dinâmico em todas as
// páginas, que era caro e frágil): a proteção vem de fechar tudo por omissão e
// abrir só o necessário.
//  - script/style 'unsafe-inline': o Next injeta scripts e estilos inline; sem
//    nonce é o preço a pagar. Ainda assim melhor que sem CSP, e combinado com os
//    outros headers fecha clickjacking, base-uri e object.
//  - connect-src: só o próprio site e o Supabase (https + wss do Realtime).
//  - img-src: menu vem do Storage do Supabase; data:/blob: para os QR codes;
//    Unsplash serve a landing e o CDN temporário serve o cardápio de teste.
//  - frame-ancestors 'none': ninguém pode embutir o site num iframe.
//  - dev precisa de 'unsafe-eval' (o React usa eval para debug) e não força
//    upgrade-insecure-requests (senão parte o localhost em http).
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://${supabaseHost} https://images.unsplash.com https://${temporaryMenuImageHost}`,
  `font-src 'self' data:`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}${sentryConnect}`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Clickjacking (reforça o frame-ancestors da CSP, para browsers antigos).
  { key: "X-Frame-Options", value: "DENY" },
  // Impede o browser de "adivinhar" o tipo de um ficheiro (ataques de upload).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vazar o URL completo (com o qr_token da mesa!) para sites externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs que a app não usa (câmara, micro, localização).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Força HTTPS por 2 anos, incluindo subdomínios. Só em produção.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  // Não anunciar "X-Powered-By: Next.js" — não dar pistas do stack de graça.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  // Foto do hero da landing pública (Unsplash). Único domínio externo de
  // imagem permitido; tudo o resto (cardápio) continua a vir do Supabase.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: supabaseHost, pathname: "/**" },
      { protocol: "https", hostname: temporaryMenuImageHost, pathname: "/**" },
    ],
  },

  // Permite testar no telemóvel pelo IP da rede local: sem isto o Next bloqueia
  // os recursos de dev (/_next/*) vindos de outra origem, a página não hidrata
  // e os botões ficam sem reação. Só afeta desenvolvimento.
  // Se o router atribuir outro IP, atualizar aqui (ver `Network:` no arranque do
  // `npm run dev`) e reiniciar o servidor.
  allowedDevOrigins: ["192.168.1.201"],
};

export default nextConfig;
