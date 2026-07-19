// Stripe Connect: cada restaurante liga a SUA conta (Express). O dinheiro do
// cliente vai direto para lá; a plataforma só orquestra. Guardamos o
// stripe_account_id e sincronizamos charges_enabled (se a conta já pode cobrar).
import "server-only";
import { getStripe } from "./server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

export type ConnectStatus = {
  connected: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
};

export async function getOrCreateConnectAccount(
  establishmentId: string,
  name: string,
): Promise<string> {
  const admin = createAdminClient();
  const { data: est } = await admin
    .from("establishments")
    .select("stripe_account_id")
    .eq("id", establishmentId)
    .single();

  if (est?.stripe_account_id) return est.stripe_account_id;

  const account = await getStripe().accounts.create({
    type: "express",
    country: "PT",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: { name },
  });

  await admin
    .from("establishments")
    .update({ stripe_account_id: account.id })
    .eq("id", establishmentId);

  return account.id;
}

export async function createOnboardingLink(accountId: string): Promise<string> {
  const base = publicEnv.appUrl;
  const link = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${base}/gestao/pagamentos?refresh=1`,
    return_url: `${base}/gestao/pagamentos?done=1`,
    type: "account_onboarding",
  });
  return link.url;
}

/** Lê o estado atual na Stripe e persiste charges_enabled. */
export async function refreshConnectStatus(
  establishmentId: string,
): Promise<ConnectStatus> {
  const admin = createAdminClient();
  const { data: est } = await admin
    .from("establishments")
    .select("stripe_account_id")
    .eq("id", establishmentId)
    .single();

  if (!est?.stripe_account_id) {
    return { connected: false, chargesEnabled: false, detailsSubmitted: false };
  }

  const acct = await getStripe().accounts.retrieve(est.stripe_account_id);
  const chargesEnabled = acct.charges_enabled ?? false;

  await admin
    .from("establishments")
    .update({ stripe_charges_enabled: chargesEnabled })
    .eq("id", establishmentId);

  return {
    connected: true,
    chargesEnabled,
    detailsSubmitted: acct.details_submitted ?? false,
  };
}
