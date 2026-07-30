"use client";

import { useActionState } from "react";
import { requestRecovery, type RecoverState } from "./actions";

const initial: RecoverState = { error: null, sent: false };

export function RecuperarForm() {
  const [state, action, pending] = useActionState(requestRecovery, initial);

  if (state.sent) {
    return (
      <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
        Se existir uma conta com esse email, enviámos um link para definir uma
        nova senha.
      </p>
    );
  }

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
        {pending ? "A enviar…" : "Enviar link"}
      </button>
    </form>
  );
}
