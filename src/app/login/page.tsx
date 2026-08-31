import Link from "next/link";
import { LoginNav } from "./LoginNav";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  const AVISOS: Record<string, string> = {
    "sem-acesso":
      "Sua conta ainda não tem acesso a este restaurante. Fale com o gestor.",
    "link-invalido": "Este link não é mais válido. Solicite um novo acesso.",
    "link-expirado": "Este link de acesso expirou. Solicite um novo.",
  };
  const aviso = erro ? (AVISOS[erro] ?? null) : null;

  return (
    <div
      className="ordo-login"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        overflow: "hidden",
        background: "#0a0807",
        color: "#fff",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        isolation: "isolate",
      }}
    >
      <LoginNav />

      <div
        className="ordo-body"
        style={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "24px clamp(20px,5vw,90px)",
          minHeight: 0,
        }}
      >
        <div
          className="ordo-panel"
          style={{
            width: "min(38vw,560px)",
            minWidth: 380,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            animation: "ordoRise .8s cubic-bezier(.16,1,.3,1) both",
          }}
        >
          <span
            className="font-mono-ui"
            style={{
              alignSelf: "flex-start",
              fontWeight: 400,
              fontSize: "clamp(11px,.72vw,13px)",
              letterSpacing: ".2em",
              textTransform: "uppercase",
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.1)",
              color: "rgba(255,255,255,.85)",
              padding: "clamp(9px,.8vw,13px) clamp(14px,1.1vw,18px)",
              lineHeight: 1,
            }}
          >
            [ Acesso staff ]
          </span>

          <h1
            className="font-sora"
            style={{
              fontWeight: 200,
              fontSize: "clamp(56px,6vw,112px)",
              letterSpacing: ".04em",
              lineHeight: 0.95,
              margin: "clamp(26px,3vw,46px) 0 0",
            }}
          >
            Ordo
          </h1>

          <p
            className="font-mono-ui"
            style={{
              fontWeight: 300,
              fontSize: "clamp(11px,.94vw,15px)",
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.6)",
              margin: "clamp(14px,1.4vw,22px) 0 0",
              lineHeight: 1.5,
            }}
          >
            Cozinha · Atendimento · Gestão
          </p>

          {aviso && (
            <div
              role="alert"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                border: "1px solid rgba(217,96,58,.4)",
                borderLeft: "2px solid #d9603a",
                background: "rgba(217,96,58,.08)",
                padding: "13px 15px",
                marginTop: "clamp(26px,3vw,40px)",
              }}
            >
              <span
                className="font-mono-ui"
                style={{ fontSize: 12, color: "#e0764f", letterSpacing: ".1em", marginTop: 1 }}
              >
                !
              </span>
              <span
                className="font-mono-ui"
                style={{
                  fontWeight: 300,
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,.82)",
                  letterSpacing: ".03em",
                }}
              >
                {aviso}
              </span>
            </div>
          )}

          <LoginForm />

          <Link
            href="/recuperar"
            className="font-mono-ui"
            style={{
              alignSelf: "center",
              fontWeight: 400,
              fontSize: "clamp(11px,.74vw,13px)",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.6)",
              marginTop: "clamp(26px,2.6vw,42px)",
            }}
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>

      <footer
        style={{
          position: "relative",
          zIndex: 5,
          borderTop: "1px solid rgba(255,255,255,.14)",
          padding: "clamp(18px,1.7vw,28px) clamp(20px,5vw,90px)",
          textAlign: "center",
        }}
      >
        <p
          className="font-mono-ui"
          style={{
            fontWeight: 300,
            fontSize: "clamp(11px,.82vw,13px)",
            letterSpacing: ".08em",
            color: "rgba(255,255,255,.5)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Ao entrar você concorda com os{" "}
          <Link href="/termos" style={{ color: "rgba(255,255,255,.85)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Termos
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" style={{ color: "rgba(255,255,255,.85)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Privacidade e LGPD
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
