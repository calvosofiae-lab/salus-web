"use client";

import { useFeaturedProfessionalsOfMonth } from "@/features/professionals/hooks/useFeaturedProfessionalsOfMonth";
import { ProfessionalCard } from "@/components/salus/professional-card";

export function FeaturedOfMonthBanner() {
  const { professionals, status } = useFeaturedProfessionalsOfMonth();

  if (status !== "ready" || professionals.length === 0) return null;

  return (
    <section>
      <div className="section-card yellow-border">
        <h2 className="section-title">
          {professionals.length > 1 ? "Profesionales destacados del mes" : "Profesional destacado del mes"}
        </h2>
        <div className="featured-grid">
          {professionals.map((prof) => (
            <ProfessionalCard key={prof.id} prof={prof} />
          ))}
        </div>
      </div>
    </section>
  );
}
