"use client";

import { useEffect, useState } from "react";
import { getOwnProfessional } from "@/repositories/professionalsRepository";
import { WeeklyAvailabilityForm } from "@/features/appointments/components/WeeklyAvailabilityForm";
import { BlockDateForm } from "@/features/appointments/components/BlockDateForm";
import type { Professional } from "@/features/professionals/types";

export default function AvailabilityPage() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOwnProfessional().then((data) => {
      setProfessional(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>;
  }
  if (!professional) {
    return (
      <p className="text-sm text-red-500">
        No encontramos un perfil de profesional asociado a tu cuenta.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold text-brand-navy">Disponibilidad</h1>
      <WeeklyAvailabilityForm professionalId={professional.id} />
      <BlockDateForm professionalId={professional.id} />
    </div>
  );
}
