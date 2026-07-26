// Rate limiting simples, em memória. Trava o abuso óbvio dos endpoints anónimos
// (criar pedido, chamar atendente) — alguém que fotografe um QR e dispare um
// script para inundar a cozinha ou spammar o atendente.
//
// Duas camadas atrás da mesma função `checkRateLimit`:
//  - Upstash Redis (contador PARTILHADO entre instâncias), quando
//    UPSTASH_REDIS_REST_URL/TOKEN estão definidos — apanha ataques distribuídos.
//  - Fallback em memória (por instância), quando o Redis não está configurado ou
//    está indisponível — nunca deixa o rate limiting derrubar o serviço.
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

// ---------- Camada partilhada (Upstash Redis), opcional ----------

// Cliente mínimo que usamos do Redis. Tipado à mão para não depender do pacote
// nos tipos (é carregado por import dinâmico só quando configurado).
type RedisLike = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
};

// undefined = ainda não tentámos; null = não configurado/indisponível.
let redisClient: RedisLike | null | undefined;

async function getRedis(): Promise<RedisLike | null> {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({ url, token }) as unknown as RedisLike;
  } catch {
    redisClient = null;
  }
  return redisClient;
}

/**
 * Janela fixa partilhada: no máximo `limit` acções por `windowSec` para a mesma
 * `key`, contadas no Redis (uma chave por janela, com expiração). Se o Redis não
 * estiver configurado ou falhar, cai para o contador em memória — o serviço
 * nunca fica refém do rate limiting.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const redis = await getRedis();
  if (!redis) return rateLimit(key, limit, windowSec);

  const now = Date.now();
  const windowMs = windowSec * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const bucketKey = `rl:${key}:${windowStart}`;

  try {
    const count = await redis.incr(bucketKey);
    // Só a primeira acção da janela define o TTL (fixa a expiração).
    if (count === 1) await redis.expire(bucketKey, windowSec);
    if (count > limit) {
      return {
        ok: false,
        retryAfterSec: Math.ceil((windowStart + windowMs - now) / 1000),
      };
    }
    return { ok: true };
  } catch {
    // Redis indisponível a meio: degrada para memória em vez de falhar.
    return rateLimit(key, limit, windowSec);
  }
}
