"use client";

import { useActionState, useState } from "react";
import { signIn, type LoginState } from "./actions";

const initial: LoginState = { error: null };

const labelStyle: React.CSSProperties = {
  fontWeight: 400,
  fontSize: 11,
  letterSpacing: ".2em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,.5)",
};

function Field({
  id,
  label,
  type,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <label htmlFor={id} className="font-mono-ui" style={labelStyle}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="font-sora"
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${focus ? "#d9603a" : "rgba(255,255,255,.26)"}`,
          borderRadius: 0,
          padding: "0 2px 13px",
          fontWeight: 300,
          fontSize: "clamp(16px,.95vw,18px)",
          color: "#fff",
          outline: "none",
          transition: "border-color .25s ease",
        }}
      />
    </div>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form
      action={action}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(20px,2vw,30px)",
        width: "100%",
        marginTop: "clamp(34px,4vw,64px)",
      }}
    >
      <Field
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@restaurante.com.br"
      />
      <Field
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
      />

      {state.error && (
        <div
          role="alert"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            border: "1px solid rgba(217,96,58,.4)",
            borderLeft: "2px solid #d9603a",
            background: "rgba(217,96,58,.08)",
            padding: "11px 14px",
            marginTop: -6,
          }}
        >
          <span className="font-mono-ui" style={{ fontSize: 12, color: "#e0764f" }}>
            !
          </span>
          <span
            className="font-mono-ui"
            style={{ fontWeight: 300, fontSize: 12.5, color: "rgba(255,255,255,.82)", letterSpacing: ".03em" }}
          >
            {state.error}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-mono-ui"
        style={{
          position: "relative",
          overflow: "hidden",
          width: "100%",
          boxSizing: "border-box",
          border: "none",
          borderRadius: 0,
          padding: "clamp(17px,1.6vw,24px) 20px",
          fontWeight: 500,
          fontSize: "clamp(11px,.78vw,13px)",
          letterSpacing: ".24em",
          textTransform: "uppercase",
          color: pending ? "rgba(255,255,255,.7)" : "#fff",
          cursor: pending ? "not-allowed" : "pointer",
          background: pending ? "rgba(217,96,58,.4)" : "#d9603a",
          transition: "background .25s ease",
        }}
      >
        <span style={{ position: "relative", zIndex: 1 }}>
          {pending ? "Entrando…" : "Entrar"}
        </span>
        {!pending && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)",
              width: "40%",
              animation: "ordoSweep 4.5s ease-in-out infinite",
            }}
          />
        )}
      </button>
    </form>
  );
}
