"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "./actions";

const initial: PasswordState = { error: null, ok: false };

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initial);

  return (
    <form action={action} className="space-y-3">
      <input
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        placeholder="Palavra-passe atual"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
      />
      <input
        name="newPassword"
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
      {state.ok && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
          Palavra-passe alterada.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-black py-3 text-white disabled:opacity-40"
      >
        {pending ? "A alterar…" : "Alterar palavra-passe"}
      </button>
    </form>
  );
}
