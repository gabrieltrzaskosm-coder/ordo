"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createStaff, removeStaff } from "./actions";
import type { Database } from "@/lib/supabase/database.types";

type Role = Database["public"]["Enums"]["staff_role"];

export type StaffMember = {
  id: string;
  role: Role;
  displayName: string | null;
  isSelf: boolean;
};

const ROLE_LABEL: Record<Role, string> = {
  owner: "Dono",
  manager: "Gerente",
  kitchen: "Cozinha",
  waiter: "Garçom",
};

export function EquipaManager({ staff }: { staff: StaffMember[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Algo deu errado.");
    });
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-medium">Equipe</h1>
        <Link href="/gestao" className="text-sm text-muted hover:underline">
          ← Gestão
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Crie contas para a cozinha e o atendimento. Cada pessoa entra em{" "}
        <code>/login</code> com o email e a senha que definir.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}

      <ul className="mb-8 space-y-2">
        {staff.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-line p-3"
          >
            <div>
              <p className="font-medium">
                {m.displayName ?? "—"}{" "}
                <span className="text-sm font-normal text-muted">
                  · {ROLE_LABEL[m.role]}
                </span>
              </p>
            </div>
            {m.role !== "owner" && !m.isSelf && (
              <button
                disabled={pending}
                onClick={() => run(() => removeStaff(m.id))}
                className="text-xs text-muted hover:text-red-700"
              >
                Remover
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mb-3 text-sm font-medium text-muted">
        Adicionar membro
      </h2>
      <form
        action={(fd) => run(() => createStaff(fd))}
        className="grid gap-2 sm:grid-cols-2"
      >
        <input
          name="displayName"
          placeholder="Nome (ex.: João)"
          className="rounded-lg border border-line px-3 py-2"
        />
        <select
          name="role"
          defaultValue="kitchen"
          className="rounded-lg border border-line px-3 py-2"
        >
          <option value="kitchen">Cozinha</option>
          <option value="waiter">Garçom</option>
          <option value="manager">Gerente</option>
        </select>
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded-lg border border-line px-3 py-2"
        />
        <input
          name="password"
          type="text"
          required
          minLength={8}
          placeholder="Senha (mín. 8)"
          className="rounded-lg border border-line px-3 py-2"
        />
        <button
          disabled={pending}
          className="rounded-lg bg-brand py-2 text-sm text-brand-ink disabled:opacity-40 sm:col-span-2"
        >
          Criar conta de acesso
        </button>
      </form>
      <p className="mt-2 text-xs text-muted">
        A senha é visível para a definir e comunicar à pessoa. Peça que a
        troque no primeiro acesso, em <code>/conta</code>.
      </p>
    </main>
  );
}
