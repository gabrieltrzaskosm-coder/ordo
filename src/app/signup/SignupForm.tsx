"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type SignupState } from "./actions";

const initial: SignupState = { error: null };

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, initial);

  return (
    <form action={action} className="space-y-3">
      <input
        name="establishmentName"
        required
        placeholder="Nome do restaurante"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
      />
      <input
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="O seu email"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
      />
      <input
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Palavra-passe (mín. 8)"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
      />
      {state.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-black py-3 text-white disabled:opacity-40"
      >
        {pending ? "A criar…" : "Criar conta e restaurante"}
      </button>
      <p className="text-xs leading-relaxed text-neutral-500">
        Ao criar a conta, declara que leu e aceita os{" "}
        <Link href="/termos" className="underline hover:text-neutral-700">
          Termos de Utilização
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="underline hover:text-neutral-700">
          Política de Privacidade
        </Link>
        .
      </p>
    </form>
  );
}
