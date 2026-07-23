// Formulário de comparação de dois períodos custom (ex.: 01/07–10/07 vs
// 11/07–21/07). Server component: é um <form method="get"> nativo, sem JS de
// cliente — ao submeter recarrega a mesma página com os intervalos em `?aFrom`,
// `?aTo`, `?bFrom`, `?bTo`, mantendo o preset ativo em `?p`.
import Link from "next/link";
import type { Period } from "@/lib/reports";

export type CompareValues = {
  aFrom?: string;
  aTo?: string;
  bFrom?: string;
  bTo?: string;
};

function DateField({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value?: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-[11px] text-muted">{label}</span>
      <input
        type="date"
        name={name}
        defaultValue={value}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand/50"
      />
    </label>
  );
}

export function CompareForm({
  basePath,
  current,
  values,
}: {
  basePath: string;
  current: Period;
  values: CompareValues;
}) {
  const active = Boolean(
    values.aFrom || values.aTo || values.bFrom || values.bTo,
  );

  return (
    <form
      method="get"
      action={basePath}
      className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
    >
      {/* Mantém o preset selecionado ao submeter a comparação. */}
      <input type="hidden" name="p" value={current} />

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs font-semibold text-ink">
            Período A
          </legend>
          <div className="flex gap-2">
            <DateField name="aFrom" label="De" value={values.aFrom} />
            <DateField name="aTo" label="Até" value={values.aTo} />
          </div>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs font-semibold text-ink">
            Período B
          </legend>
          <div className="flex gap-2">
            <DateField name="bFrom" label="De" value={values.bFrom} />
            <DateField name="bTo" label="Até" value={values.bTo} />
          </div>
        </fieldset>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Comparar
        </button>
        {active && (
          <Link
            href={`${basePath}?p=${current}`}
            className="text-sm text-muted hover:underline"
          >
            Limpar
          </Link>
        )}
      </div>
    </form>
  );
}
