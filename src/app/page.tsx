import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <main className="mx-auto max-w-2xl flex-1 p-8">
      <h1 className="text-2xl font-medium">App Pedidos</h1>
      <p className="mt-2 text-neutral-500">
        Pedidos e pagamento por QR code para restauração. Fundação do MVP
        (Plano 1).
      </p>

      <div className="mt-8 grid gap-3">
        <Link
          href="/mesa/demo-mesa-1"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
        >
          <p className="font-medium">Cliente — Mesa 1 (demo)</p>
          <p className="text-sm text-neutral-500">
            Fluxo do comensal: menu, pedido, chamar garçom.
          </p>
        </Link>
        <Link
          href="/cozinha"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
        >
          <p className="font-medium">Cozinha / atendimento</p>
          <p className="text-sm text-neutral-500">Fila de pedidos em tempo real.</p>
        </Link>
        <Link
          href="/gestao"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
        >
          <p className="font-medium">Dono / gerente</p>
          <p className="text-sm text-neutral-500">Menu, mesas e financeiro.</p>
        </Link>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
