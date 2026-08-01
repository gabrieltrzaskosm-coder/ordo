import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-xl font-medium">Criar seu restaurante</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">
        Crie a conta de dono e o restaurante. Depois é só montar o cardápio, as
        mesas e a equipe.
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
