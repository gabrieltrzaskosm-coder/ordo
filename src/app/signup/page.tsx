import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-xl font-medium">Criar o seu restaurante</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">
        Cria a conta de dono e o estabelecimento. A seguir monta o menu, as mesas
        e a equipa.
      </p>
      <SignupForm />
      <p className="mt-4 text-sm text-neutral-500">
        Já tem conta?{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
