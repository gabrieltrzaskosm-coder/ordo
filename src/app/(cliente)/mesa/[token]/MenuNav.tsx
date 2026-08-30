"use client";

import { useEffect, useRef, useState } from "react";
import type { MenuCategory } from "@/lib/menu";

// Barra de categorias deslizável no topo. Toca numa categoria para saltar para
// a secção; a categoria ativa acompanha o scroll (scroll-spy) e mantém-se à
// vista na barra. As secções vivem em ClienteMenu com id="cat-<id>".
export function MenuNav({ categories }: { categories: MenuCategory[] }) {
  const [active, setActive] = useState<string | null>(
    categories[0]?.id ?? null,
  );
  const navRef = useRef<HTMLElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Scroll-spy: a categoria ativa é a última cujo topo já passou por baixo da
  // barra fixa. Mais fiável que um IntersectionObserver de banda estreita
  // (que falha nos saltos e entre secções). Loop barato (poucas categorias),
  // sem depender de rAF.
  useEffect(() => {
    const LINE = 112; // altura aproximada do cabeçalho + categorias no celular
    const update = () => {
      let current = categories[0]?.id ?? null;
      for (const c of categories) {
        const el = document.getElementById(`cat-${c.id}`);
        if (el && el.getBoundingClientRect().top <= LINE) current = c.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [categories]);

  // Mantém o chip ativo visível na barra — scroll SÓ horizontal, para não
  // interferir com o salto vertical à secção (scrollIntoView em ambos os eixos
  // cancelava o scroll suave da página).
  useEffect(() => {
    if (!active) return;
    const chip = chipRefs.current[active];
    const nav = navRef.current;
    if (!chip || !nav) return;
    const target =
      chip.offsetLeft - nav.clientWidth / 2 + chip.clientWidth / 2;
    nav.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [active]);

  function go(id: string) {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document.getElementById(`cat-${id}`)?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
    setActive(id);
  }

  if (categories.length === 0) return null;

  return (
    <nav
      ref={navRef}
      className="mx-auto flex max-w-md gap-2 overflow-x-auto border-t border-line px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {categories.map((c) => {
        const isActive = c.id === active;
        return (
          <button
            key={c.id}
            ref={(el) => {
              chipRefs.current[c.id] = el;
            }}
            onClick={() => go(c.id)}
            aria-current={isActive ? "true" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              isActive
                ? "bg-brand text-brand-ink"
                : "bg-surface-2 text-muted hover:text-ink"
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </nav>
  );
}
