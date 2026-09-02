"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Links da nav → secções da landing pública (/).
const LINKS = [
  { href: "/#diferenciais", label: "Produto" },
  { href: "/#como", label: "Segurança" },
  { href: "/#contato", label: "Contato" },
];

const linkStyle: React.CSSProperties = {
  color: "#191919",
  transition: "color .25s ease",
};

export function LoginNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const fallback = burgerRef.current;
    const frame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !menuRef.current) return;
      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>("a[href], button"),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      (previous ?? fallback)?.focus();
    };
  }, [open]);

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
            color: "#191919",
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
          </div>

          <button
            ref={burgerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ordo-burger font-mono-ui"
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "1px solid rgba(25,25,25,.24)",
              color: "#191919",
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
        ref={menuRef}
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
          background: "rgba(255,255,255,.96)",
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
                color: "#191919",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
