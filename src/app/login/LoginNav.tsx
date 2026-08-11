"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Links da nav → secções da landing pública (/).
const LINKS = [
  { href: "/#diferenciais", label: "Produto" },
  { href: "/#como", label: "Segurança" },
  { href: "/#contato", label: "Contato" },
];

const linkStyle: React.CSSProperties = {
  color: "#fff",
  transition: "color .25s ease",
};

export function LoginNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <>
      <nav
        style={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
          padding: "clamp(20px,2.4vw,34px) clamp(20px,5vw,90px)",
        }}
      >
        <Link
          href="/"
          className="font-sora"
          style={{
            fontWeight: 200,
            fontSize: "clamp(20px,1.75vw,28px)",
            letterSpacing: ".22em",
            lineHeight: 1,
            color: "#fff",
          }}
        >
          ORDO
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "clamp(24px,3.2vw,56px)" }}>
          <div
            className="ordo-navlinks font-mono-ui"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(20px,2.8vw,48px)",
              fontWeight: 400,
              fontSize: "clamp(11px,.78vw,13px)",
              letterSpacing: ".18em",
              textTransform: "uppercase",
            }}
          >
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} style={linkStyle}>
                {l.label}
              </Link>
            ))}
            <Link
              href="/signup"
              style={{
                ...linkStyle,
                border: "1px solid rgba(255,255,255,.26)",
                padding: "11px 18px",
              }}
            >
              Criar conta
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="ordo-burger font-mono-ui"
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "1px solid rgba(255,255,255,.26)",
              color: "#fff",
              fontWeight: 400,
              fontSize: 12,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              padding: "12px 18px",
              cursor: "pointer",
            }}
          >
            {open ? "Fechar" : "Menu"}
          </button>
        </div>
      </nav>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="ordo-mobmenu"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(6,5,4,.95)",
          backdropFilter: "blur(26px) saturate(140%)",
          WebkitBackdropFilter: "blur(26px) saturate(140%)",
          transition: "clip-path .7s cubic-bezier(.16,1,.3,1),opacity .45s ease",
          transformOrigin: "top right",
          clipPath: open
            ? "circle(150% at calc(100% - 54px) 40px)"
            : "circle(0px at calc(100% - 54px) 40px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div
          className="font-mono-ui"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(22px,5vw,34px)" }}
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                fontWeight: 400,
                fontSize: "clamp(20px,5.5vw,26px)",
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "#fff",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            style={{
              fontWeight: 400,
              fontSize: "clamp(15px,4vw,18px)",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "#fff",
              padding: "16px 40px",
              border: "1px solid rgba(255,255,255,.26)",
              marginTop: 12,
            }}
          >
            Criar conta
          </Link>
        </div>
      </div>
    </>
  );
}
