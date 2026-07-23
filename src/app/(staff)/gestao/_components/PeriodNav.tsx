// Seletor de período (pills) partilhado pelas páginas de análise. Server
// component: cada opção é só um link que troca `?p=`, sem JS de cliente. O
// período ativo fica destacado. Trocar de período limpa a comparação (que é uma
// ação explícita à parte).
import Link from "next/link";
import { PERIODS, type Period } from "@/lib/reports";

export function PeriodNav({
  basePath,
  current,
}: {
  basePath: string;
  current: Period;
}) {
  return (
    <nav className="flex flex-wrap gap-1.5">
      {PERIODS.map((p) => {
        const active = p.key === current;
        return (
          <Link
            key={p.key}
            href={`${basePath}?p=${p.key}`}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-card)]"
                : "rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand/40"
            }
          >
            {p.label}
          </Link>
        );
      })}
    </nav>
  );
}
