import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  const aviso =
    erro === "sem-acesso"
      ? "Esta conta não está associada a nenhum estabelecimento."
      : null;

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
        Ainda não tem restaurante?{" "}
        <Link href="/signup" className="underline">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
