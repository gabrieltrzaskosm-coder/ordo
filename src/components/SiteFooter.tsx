import Link from "next/link";

// Rodapé público com os links legais. Usado nas páginas abertas (início,
// documentos legais). O nome/entidade é um PLACEHOLDER a preencher.
export function SiteFooter() {
  const ano = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-neutral-200">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-1 p-6 text-sm text-neutral-500">
        <span>© {ano} App Pedidos</span>
        <Link href="/termos" className="underline hover:text-neutral-700">
          Termos
        </Link>
        <Link href="/privacidade" className="underline hover:text-neutral-700">
          Privacidade e LGPD
        </Link>
      </div>
    </footer>
  );
}
