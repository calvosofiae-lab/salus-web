"use client";

import { useEffect, useState } from "react";
import { ProfessionalForm } from "@/features/professionals/components/ProfessionalForm";
import { useUpdateOwnProfile } from "@/features/professionals/hooks/useUpdateOwnProfile";
import { getOwnProfessional } from "@/repositories/professionalsRepository";
import type { Professional } from "@/features/professionals/types";

export default function OwnProfilePage() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOwnProfessional().then((data) => {
      setProfessional(data);
      setLoading(false);
    });
  }, []);

  const { update, error, success, isLoading } = useUpdateOwnProfile(professional?.id ?? "");

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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-navy">Mi perfil</h1>
      <ProfessionalForm
        mode="edit"
        hideFeaturedToggle
        initialValues={{
          full_name: professional.full_name,
          profession: professional.profession,
          license_number: professional.license_number ?? "",
          gender: professional.gender ?? "",
          description: professional.description ?? "",
          photo_url: professional.photo_url ?? "",
          whatsapp: professional.whatsapp ?? "",
          province: professional.province ?? "",
          city: professional.city ?? "",
          coverage: professional.coverage,
          modality: professional.modality,
          consultation_reasons: professional.consultation_reasons,
          is_featured: professional.is_featured,
        }}
        onSubmit={async (values) => {
          await update(values);
        }}
        isLoading={isLoading}
        error={error}
        submitLabel="Guardar cambios"
      />
      {success && <p className="text-sm text-green-600">Perfil actualizado correctamente.</p>}
    </div>
  );
}
