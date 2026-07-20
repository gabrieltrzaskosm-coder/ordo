"use client";

import Link from "next/link";
import { useActionState } from "react";
import { setNewPassword, type NovaSenhaState } from "./actions";

const initial: NovaSenhaState = { error: null, ok: false };

export function NovaSenhaForm() {
  const [state, action, pending] = useActionState(setNewPassword, initial);

  if (state.ok) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
          Palavra-passe definida.
        </p>
        <Link
          href="/cozinha"
          className="block w-full rounded-lg bg-black py-3 text-center text-white"
        >
          Continuar
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Nova palavra-passe (mín. 8)"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
      />
      <input
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Confirmar nova palavra-passe"
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
        {pending ? "A guardar…" : "Definir palavra-passe"}
      </button>
    </form>
  );
}
