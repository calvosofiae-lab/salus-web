"use client";

import { useFeaturedProfessionals } from "@/features/professionals/hooks/useFeaturedProfessionals";
import { ProfessionalCard } from "@/components/salus/professional-card";

export function FeaturedProfessionals() {
  const { status, professionals } = useFeaturedProfessionals();

  return (
    <div id="destacadosGrid" className="featured-grid">
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
  );
}
