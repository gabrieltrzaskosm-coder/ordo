import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  const AVISOS: Record<string, string> = {
    "sem-acesso": "Esta conta não está associada a nenhum restaurante.",
    "link-invalido": "Link inválido. Peça um novo e-mail de recuperação.",
    "link-expirado": "O link expirou. Peça um novo e-mail de recuperação.",
  };
  const aviso = erro ? (AVISOS[erro] ?? null) : null;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-5 py-10">
      {/* Aurora quente animada atrás do cartão: ondas de terracota e âmbar que
         derivam devagar. Tom forte e espalhado; congela em prefers-reduced-motion. */}
      <div aria-hidden className="login-aurora pointer-events-none">
        <span className="wave-1" />
        <span className="wave-2" />
        <span className="wave-3" />
      </div>

      <div className="reveal relative w-full max-w-sm">
        {/* Marca */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            Ordo
          </span>
          <span className="text-xs text-muted">por Otium</span>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Entrar
          </h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            Acesso para cozinha, atendimento e gestão.
          </p>

          {aviso && (
            <p className="mb-4 rounded-lg bg-warn-weak p-3 text-sm text-ink">
              {aviso}
            </p>
          )}

          <LoginForm />

          <div className="mt-5 border-t border-line pt-4 text-sm">
            <Link
              href="/recuperar"
              className="text-muted transition hover:text-brand"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Ainda não tem restaurante?{" "}
          <Link
            href="/signup"
            className="font-medium text-brand transition hover:text-brand-strong"
          >
            Criar conta
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-muted/80">
          <Link href="/termos" className="transition hover:text-ink">
            Termos
          </Link>{" "}
          ·{" "}
          <Link href="/privacidade" className="transition hover:text-ink">
            Privacidade e LGPD
          </Link>
        </p>
      </div>
    </main>
  );
}
