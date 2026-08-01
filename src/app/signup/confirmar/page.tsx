import Link from "next/link";

// Ecrã de espera após o registo. Não recebe o email por query string de
// propósito: não vale a pena expor endereços no histórico do browser.
export default function ConfirmarPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-xl font-medium">Confirme seu e-mail</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Enviamos um link de confirmação. Abra o link para ativar sua conta e
        entrar na gestão do seu restaurante.
      </p>
      <p className="mt-4 text-sm text-neutral-500">
        Não recebeu? Verifique a pasta de spam. O link é válido por tempo
        limitado — se expirar, use{" "}
        <Link href="/recuperar" className="underline">
          recuperar acesso
        </Link>
        .
      </p>
      <p className="mt-6 text-sm text-neutral-500">
        <Link href="/login" className="underline">
          Ir para o login
        </Link>
      </p>
    </main>
  );
}
