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
// Se a Stripe recusar (ex.: perfil de plataforma incompleto), NÃO rebenta a
// página: volta a /gestao/pagamentos?erro=... com a mensagem, para a UI mostrar.
export async function startOnboarding() {
  const session = await requireManager();
  let url: string | null = null;
  try {
    const accountId = await getOrCreateConnectAccount(
      session.establishmentId,
      session.establishmentName,
    );
    url = await createOnboardingLink(accountId);
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Não foi possível ligar os pagamentos. Tente novamente.";
    redirect(`/gestao/pagamentos?erro=${encodeURIComponent(msg)}`);
  }
  // Fora do try: redirect() lança internamente e não deve ser apanhado acima.
  redirect(url);
}

export async function refreshStatus() {
  const session = await requireManager();
  await refreshConnectStatus(session.establishmentId);
  revalidatePath("/gestao/pagamentos");
}
