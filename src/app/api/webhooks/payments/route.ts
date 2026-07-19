// Webhook Stripe. Regras do plano:
//  1. Verificar a ASSINATURA (constructEvent com STRIPE_WEBHOOK_SECRET).
//  2. IDEMPOTÊNCIA: registar event.id em `webhook_events`; se já existir, não
//     reprocessar.
//  3. SÓ o webhook marca `paid` — nunca o redirect ?pago=1 do browser.
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { maybeCloseTable } from "@/lib/orders/close";

export async function POST(request: Request) {
  const secret = serverEnv.stripeWebhookSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET não configurado." },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "sem assinatura" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotência: insere o evento; conflito (unique) → já processado.
  const { error: dupErr } = await supabase.from("webhook_events").insert({
    provider: "stripe",
    event_id: event.id,
    payload: { type: event.type },
  });
  if (dupErr) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentIntent =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    // Marca o pagamento como pago (localizado pela sessão de checkout).
    const { data: payment } = await supabase
      .from("payments")
      .update({
        status: "paid",
        provider_ref: paymentIntent,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_checkout_session_id", session.id)
      .select("order_id, amount_cents, tip_cents")
      .maybeSingle();

    // Reflete gorjeta + total pago e carimba paid_at (visível ao staff via
    // Realtime de orders, sem expor a tabela payments).
    if (payment) {
      const now = new Date().toISOString();
      const { data: order } = await supabase
        .from("orders")
        .update({
          tip_cents: payment.tip_cents,
          total_cents: payment.amount_cents,
          paid_at: now,
          updated_at: now,
        })
        .eq("id", payment.order_id)
        .select("table_id")
        .maybeSingle();

      // Pagamento pela app pode satisfazer a condição de zerar a mesa.
      if (order) await maybeCloseTable(order.table_id);
    }
  }

  await supabase
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider", "stripe")
    .eq("event_id", event.id);

  return NextResponse.json({ received: true });
}
