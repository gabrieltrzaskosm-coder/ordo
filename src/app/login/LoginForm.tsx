"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initial: LoginState = { error: null };

const inputClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-ink placeholder:text-muted/70 transition focus:border-brand focus:bg-surface";
const labelClass = "block text-sm font-medium text-ink";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className={labelClass}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@restaurante.com.br"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className={labelClass}>
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Sua senha"
          className={inputClass}
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-warn-weak p-3 text-sm text-ink">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand py-3 font-semibold text-brand-ink transition hover:bg-brand-strong disabled:opacity-50"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
