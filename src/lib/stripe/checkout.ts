// Checkout do cliente via Stripe Checkout (página hospedada → cobre cartão,
// Apple Pay, Google Pay, MB WAY, Multibanco sem nós tocarmos em dados de cartão).
//
// Modelo Connect: DESTINATION CHARGE — a cobrança corre na conta da plataforma e
// o valor é transferido para a conta do restaurante (transfer_data.destination).
// A comissão da plataforma (application_fee) está a 0 por agora.
import "server-only";
import { getStripe } from "./server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

// Comissão da plataforma em basis points (0 = sem comissão por agora).
const PLATFORM_FEE_BPS = 0;

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createOrderCheckout(
  qrToken: string,
  orderId: string,
  tipCents: number,
): Promise<CheckoutResult> {
  const admin = createAdminClient();

  // Resolve o pedido + estabelecimento a partir do token (defesa: o pedido tem
  // de pertencer ao estabelecimento daquela mesa).
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, subtotal_cents, status, establishment_id, restaurant_tables(qr_token, label), establishments(currency, stripe_account_id, stripe_charges_enabled, name)",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { ok: false, error: "Pedido não encontrado." };

  const table = order.restaurant_tables as unknown as {
    qr_token: string;
    label: string;
  } | null;
  const est = order.establishments as unknown as {
    currency: string;
    stripe_account_id: string | null;
    stripe_charges_enabled: boolean;
    name: string;
  } | null;

  if (!table || table.qr_token !== qrToken) {
    return { ok: false, error: "Pedido não corresponde a esta mesa." };
  }
  if (order.status === "cancelled") {
    return { ok: false, error: "Pedido cancelado." };
  }
  if (!est?.stripe_account_id || !est.stripe_charges_enabled) {
    return {
      ok: false,
      error: "Pagamentos ainda não estão ativos neste restaurante.",
    };
  }

  const safeTip = Math.max(0, Math.min(tipCents, order.subtotal_cents * 5));
  const currency = est.currency.toLowerCase();
  const base = publicEnv.appUrl;

  const lineItems: {
    price_data: {
      currency: string;
      product_data: { name: string };
      unit_amount: number;
    };
    quantity: number;
  }[] = [
    {
      price_data: {
        currency,
        product_data: { name: `Pedido · ${table.label}` },
        unit_amount: order.subtotal_cents,
      },
      quantity: 1,
    },
  ];
  if (safeTip > 0) {
    lineItems.push({
      price_data: {
        currency,
        product_data: { name: "Gorjeta" },
        unit_amount: safeTip,
      },
      quantity: 1,
    });
  }

  const total = order.subtotal_cents + safeTip;
  const fee = Math.round((total * PLATFORM_FEE_BPS) / 10000);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    payment_intent_data: {
      ...(fee > 0 ? { application_fee_amount: fee } : {}),
      transfer_data: { destination: est.stripe_account_id },
      metadata: { order_id: order.id, establishment_id: order.establishment_id },
    },
    success_url: `${base}/mesa/${qrToken}?pago=1`,
    cancel_url: `${base}/mesa/${qrToken}?cancelado=1`,
    metadata: { order_id: order.id, establishment_id: order.establishment_id },
  });

  if (!session.url) return { ok: false, error: "Falha ao iniciar o pagamento." };

  // Regista o pagamento pendente. Só o webhook o marca como pago.
  await admin.from("payments").insert({
    establishment_id: order.establishment_id,
    order_id: order.id,
    provider: "stripe",
    provider_ref: typeof session.payment_intent === "string"
      ? session.payment_intent
      : null,
    amount_cents: total,
    tip_cents: safeTip,
    status: "pending",
    stripe_checkout_session_id: session.id,
  });

  return { ok: true, url: session.url };
}
