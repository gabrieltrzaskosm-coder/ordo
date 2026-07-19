"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import {
  createOnboardingLink,
  getOrCreateConnectAccount,
  refreshConnectStatus,
} from "@/lib/stripe/connect";

// Cria (ou reutiliza) a conta Connect e envia o dono para o onboarding hospedado
// pela Stripe. Ao voltar, cai em /gestao/pagamentos?done=1.
export async function startOnboarding() {
  const session = await requireManager();
  const accountId = await getOrCreateConnectAccount(
    session.establishmentId,
    session.establishmentName,
  );
  const url = await createOnboardingLink(accountId);
  redirect(url);
}

export async function refreshStatus() {
  const session = await requireManager();
  await refreshConnectStatus(session.establishmentId);
  revalidatePath("/gestao/pagamentos");
}
