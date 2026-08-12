"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFeaturedProfessionals } from "@/features/professionals/hooks/useFeaturedProfessionals";
import { ProfessionalCard } from "@/components/salus/professional-card";

export function FeaturedProfessionals() {
  const { status, professionals } = useFeaturedProfessionals();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Se desliza un 80% del ancho visible en vez de card por card: no depende de saber el
  // ancho exacto de cada card (que varía por breakpoint) y funciona igual con cualquier
  // cantidad de profesionales destacados.
  function scrollByPage(direction: 1 | -1) {
    scrollerRef.current?.scrollBy({
      left: direction * scrollerRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  const showArrows = status === "ready" && professionals.length > 1;

  return (
    <div className="featured-carousel-wrapper">
      {showArrows && (
        <button
          type="button"
          className="featured-carousel-btn featured-carousel-btn--prev"
          aria-label="Ver profesionales anteriores"
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
      )}

      <div id="destacadosGrid" className="featured-carousel" ref={scrollerRef}>
        {status === "loading" && <div className="status-msg">Cargando destacados...</div>}
        {status === "empty" && (
          <div className="status-msg">No hay profesionales destacados en este momento.</div>
        )}
        {status === "error" && (
          <div className="status-msg">Error al cargar los profesionales destacados.</div>
        )}
        {status === "ready" &&
          professionals.map((prof) => <ProfessionalCard key={prof.id} prof={prof} />)}
      </div>

      {showArrows && (
        <button
          type="button"
          className="featured-carousel-btn featured-carousel-btn--next"
          aria-label="Ver más profesionales"
          onClick={() => scrollByPage(1)}
        >
          <ChevronRight size={20} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
