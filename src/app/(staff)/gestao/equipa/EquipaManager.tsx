"use client";

import { useState, useTransition } from "react";
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

// Cor do avatar/pill por função (fg/bg).
const ROLE_STYLE: Record<Role, { bg: string; fg: string }> = {
  owner: { bg: "rgba(212,29,13,.12)", fg: "#b01808" },
  manager: { bg: "rgba(37,99,235,.12)", fg: "#1d4ed8" },
  kitchen: { bg: "rgba(217,119,6,.14)", fg: "#b45309" },
  waiter: { bg: "rgba(21,128,61,.13)", fg: "#15803d" },
};

function initials(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function EquipaManager({ staff }: { staff: StaffMember[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Algo deu errado.");
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
            Equipe
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Gerencie acessos por função. Cada pessoa entra em <code>/login</code>{" "}
            com o email e a senha.
          </p>
        </div>
        <button
          onClick={() => setShowInvite((s) => !s)}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-brand-ink transition active:scale-95"
        >
          {showInvite ? "Fechar" : "+ Convidar"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-brand/30 bg-brand-weak p-3 text-sm text-brand-strong">
          {error}
        </p>
      )}

      {/* Convidar membro */}
      {showInvite && (
        <div className="mt-5 rounded-[20px] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
          <form
            action={(fd) =>
              run(async () => {
                const res = await createStaff(fd);
                if (res.ok) setShowInvite(false);
                return res;
              })
            }
            className="grid gap-2.5 sm:grid-cols-2"
          >
            <input
              name="displayName"
              placeholder="Nome (ex.: João)"
              className="rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted"
            />
            <select
              name="role"
              defaultValue="kitchen"
              className="rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink"
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
              className="rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted"
            />
            <input
              name="password"
              type="text"
              required
              minLength={8}
              placeholder="Senha (mín. 8)"
              className="rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted"
            />
            <button
              disabled={pending}
              className="rounded-full bg-brand py-2.5 text-sm font-semibold text-brand-ink disabled:opacity-40 sm:col-span-2"
            >
              Criar conta de acesso
            </button>
          </form>
          <p className="mt-2 text-xs text-muted">
            A senha é visível para a definir e comunicar à pessoa. Peça que a
            troque no primeiro acesso, em <code>/conta</code>.
          </p>
        </div>
      )}

      {/* Membros */}
      <div className="mt-5 space-y-2.5">
        {staff.map((m) => {
          const rs = ROLE_STYLE[m.role];
          return (
            <div
              key={m.id}
              className="flex items-center gap-3.5 rounded-[18px] border border-line bg-surface p-3.5 shadow-[var(--shadow-card)]"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold"
                style={{ background: rs.bg, color: rs.fg }}
              >
                {initials(m.displayName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">
                  {m.displayName ?? "—"}
                  {m.isSelf && (
                    <span className="ml-2 text-xs font-medium text-muted">
                      (você)
                    </span>
                  )}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: rs.bg, color: rs.fg }}
              >
                {ROLE_LABEL[m.role]}
              </span>
              {m.role !== "owner" && !m.isSelf && (
                <button
                  disabled={pending}
                  onClick={() => run(() => removeStaff(m.id))}
                  className="shrink-0 text-xs font-medium text-muted transition hover:text-brand"
                >
                  Remover
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
