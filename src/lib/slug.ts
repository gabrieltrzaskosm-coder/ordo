import { randomBytes } from "node:crypto";

// Slug a partir do nome do estabelecimento. Sufixo aleatório garante unicidade
// sem lógica de retry em colisão. Ainda não é user-facing no routing (que usa
// qr_token), mas `establishments.slug` é UNIQUE.
export function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = randomBytes(3).toString("hex");
  return `${base || "estab"}-${suffix}`;
}
