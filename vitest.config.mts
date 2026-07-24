import { defineConfig } from "vitest/config";

// Testes de LÓGICA, não de UI: ambiente `node` (mais rápido e sem jsdom). O
// `resolve.tsconfigPaths` dá-nos os aliases `@/…` sem plugin extra.
//
// Nota: os módulos de servidor importam "server-only", que rebenta fora do
// Next. Por isso os testes importam apenas os módulos PUROS (lib/pricing.ts,
// lib/availability.ts) — a mesma lógica que a app usa, sem I/O.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
