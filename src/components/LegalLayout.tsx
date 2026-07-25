import Link from "next/link";
import { SiteFooter } from "./SiteFooter";

// Moldura comum aos documentos legais: cabeçalho, data e rodapé com links.
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        <Link href="/" className="text-sm text-neutral-500 underline">
          ← Início
        </Link>
        <h1 className="mt-4 text-2xl font-medium text-neutral-900">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Última atualização: {updated}
        </p>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

// Pequenos blocos de texto reutilizados nos documentos, para manter o estilo.
export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-1 text-lg font-medium text-neutral-800">{children}</h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-sm leading-relaxed text-neutral-600">{children}</p>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-600">
      {children}
    </ul>
  );
}
