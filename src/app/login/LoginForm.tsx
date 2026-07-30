"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="space-y-3">
      <input
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="Email"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
      />
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="Senha"
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
        {pending ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}
