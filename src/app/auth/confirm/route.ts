// Destino dos links enviados por email (confirmação de conta e recuperação de
// senha). Recebe `token_hash` + `type` e troca-os por sessão via verifyOtp.
//
// Porquê token_hash e não o fluxo PKCE com `code`: o code verifier fica num
// cookie do browser que iniciou o pedido. Como as pessoas abrem o email no
// telemóvel depois de fazerem o registo no portátil, o PKCE falharia nesse
// salto de dispositivo. O token_hash não depende de estado local.
//
// Requer templates de email (Supabase > Auth > Email Templates) a apontar para
// {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=…
import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Allowlist em vez de validar a string: o `next` vem de um link externo e um
// destino livre seria um open redirect.
const DESTINOS: Record<string, string> = {
  "/nova-senha": "/nova-senha",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });
  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=link-expirado`);
  }

  const destino = (next && DESTINOS[next]) ?? (type === "recovery" ? "/nova-senha" : "/gestao");
  const response = NextResponse.redirect(`${origin}${destino}`);

  if (destino === "/nova-senha") {
    // Marca que esta sessão nasceu de um link de recuperação. Sem isto,
    // qualquer sessão já aberta podia definir uma senha nova sem saber a
    // antiga — precisamente o que /conta evita ao pedir a atual.
    response.cookies.set("pw-recovery", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 15,
    });
  }

  return response;
}
