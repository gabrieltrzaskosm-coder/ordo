import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  const AVISOS: Record<string, string> = {
    "sem-acesso": "Esta conta não está associada a nenhum estabelecimento.",
    "link-invalido": "Link inválido. Peça um novo email de recuperação.",
    "link-expirado": "O link expirou. Peça um novo email de recuperação.",
  };
  const aviso = erro ? (AVISOS[erro] ?? null) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-xl font-medium">Entrar</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">
        Acesso para cozinha, atendimento e gestão.
      </p>
      {aviso && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {aviso}
        </p>
      )}
      <LoginForm />
      <p className="mt-4 text-sm text-neutral-500">
        <Link href="/recuperar" className="underline">
          Esqueci-me da palavra-passe
        </Link>
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        Ainda não tem restaurante?{" "}
        <Link href="/signup" className="underline">
          Criar conta
        </Link>
      </p>
      <p className="mt-6 text-xs text-neutral-400">
        <Link href="/termos" className="underline hover:text-neutral-600">
          Termos
        </Link>{" "}
        ·{" "}
        <Link href="/privacidade" className="underline hover:text-neutral-600">
          Privacidade e RGPD
        </Link>
      </p>
    </main>
  );
}
