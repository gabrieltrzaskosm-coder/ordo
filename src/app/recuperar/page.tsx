import Link from "next/link";
import { RecuperarForm } from "./RecuperarForm";

export default function RecuperarPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-xl font-medium">Recuperar acesso</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">
        Indique o email da sua conta. Enviamos um link para definir uma nova
        palavra-passe.
      </p>
      <RecuperarForm />
      <p className="mt-4 text-sm text-neutral-500">
        <Link href="/login" className="underline">
          Voltar ao login
        </Link>
      </p>
    </main>
  );
}
