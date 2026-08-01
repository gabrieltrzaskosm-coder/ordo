"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type SignupState } from "./actions";

const initial: SignupState = { error: null };

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-900 focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="establishmentName" className={labelClass}>
          Nome do restaurante
        </label>
        <input
          id="establishmentName"
          name="establishmentName"
          required
          maxLength={80}
          placeholder="Ex.: Cantina da Praça"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="ownerName" className={labelClass}>
          Seu nome{" "}
          <span className="font-normal text-neutral-400">(opcional)</span>
        </label>
        <input
          id="ownerName"
          name="ownerName"
          autoComplete="name"
          maxLength={80}
          placeholder="Quem vai administrar"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="phone" className={labelClass}>
          WhatsApp
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="(51) 99999-9999"
          className={inputClass}
        />
        <p className="text-xs text-neutral-500">
          É por aqui que a gente combina a instalação e o treino.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="taxId" className={labelClass}>
          CNPJ ou CPF{" "}
          <span className="font-normal text-neutral-400">(opcional)</span>
        </label>
        <input
          id="taxId"
          name="taxId"
          inputMode="numeric"
          maxLength={20}
          placeholder="Para a nota fiscal, depois"
          className={inputClass}
        />
      </div>

      <hr className="border-neutral-200" />

      <div className="space-y-1">
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

      <div className="space-y-1">
        <label htmlFor="password" className={labelClass}>
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Mínimo de 8 caracteres"
          className={inputClass}
        />
      </div>

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
        {pending ? "Criando…" : "Criar conta e restaurante"}
      </button>
      <p className="text-xs leading-relaxed text-neutral-500">
        Ao criar a conta, você declara que leu e aceita os{" "}
        <Link href="/termos" className="underline hover:text-neutral-700">
          Termos de Uso
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
