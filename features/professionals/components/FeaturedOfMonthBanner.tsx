"use client";

import Link from "next/link";
import { useFeaturedProfessionalOfMonth } from "@/features/professionals/hooks/useFeaturedProfessionalOfMonth";

export function FeaturedOfMonthBanner() {
  const { professional, status } = useFeaturedProfessionalOfMonth();

  if (status !== "ready" || !professional) return null;

  return (
    <section>
      <div className="section-card yellow-border">
        <h2 className="section-title">Profesional destacado del mes</h2>
        <div className="section-content">
          <p>
            <Link href={`/profesionales/${professional.id}`}>{professional.full_name}</Link>
            {" "}— calificación promedio {professional.average_rating?.toFixed(1)} / 5 este mes.
          </p>
        </div>
      </div>
    </section>
  );
}
