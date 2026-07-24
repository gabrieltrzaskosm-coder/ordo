// Rate limiting simples, em memória. Trava o abuso óbvio dos endpoints anónimos
// (criar pedido, chamar atendente) — alguém que fotografe um QR e dispare um
// script para inundar a cozinha ou spammar o atendente.
//
// LIMITE conhecido: a contagem vive na memória de CADA instância serverless, e
// as instâncias não partilham nem persistem. Apanha o atacante que martela a
// mesma instância quente, não um ataque distribuído. Para isso é preciso um
// contador partilhado (ex.: Upstash Redis) — a interface abaixo foi pensada
// para se trocar por isso sem mexer em quem a chama.
import "server-only";

type Bucket = { count: number; resetAt: number };

// Chave -> janela atual. Um Map em módulo: partilhado entre pedidos da mesma
// instância, perdido quando a instância recicla (aceitável para este fim).
const buckets = new Map<string, Bucket>();

// Evita o Map crescer sem fim numa instância de vida longa: limpa janelas
// expiradas de vez em quando.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * Janela fixa: no máximo `limit` acções por `windowSec` para a mesma `key`.
 * Devolve { ok: false, retryAfterSec } quando o limite é ultrapassado.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true };
  }

  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }

  b.count += 1;
  return { ok: true };
}
