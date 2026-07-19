import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite testar no telemóvel pelo IP da rede local: sem isto o Next bloqueia
  // os recursos de dev (/_next/*) vindos de outra origem, a página não hidrata
  // e os botões ficam sem reação. Só afeta desenvolvimento.
  // Se o router atribuir outro IP, atualizar aqui (ver `Network:` no arranque do
  // `npm run dev`) e reiniciar o servidor.
  allowedDevOrigins: ["192.168.1.201"],
};

export default nextConfig;
