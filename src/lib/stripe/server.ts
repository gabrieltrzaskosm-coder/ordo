// Cliente Stripe (server-only). A API version é a fixada pelo SDK instalado
// (2026-06-24.dahlia no stripe@22) — não a codificamos à mão para não divergir
// dos tipos. Só usado em código de servidor; a chave secreta nunca vai ao browser.
import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = serverEnv.stripeSecretKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY em falta.");
  cached = new Stripe(key);
  return cached;
}
