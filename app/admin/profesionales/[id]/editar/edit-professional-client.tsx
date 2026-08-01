"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProfessionalForm } from "@/features/professionals/components/ProfessionalForm";
import { useUpdateProfessional } from "@/features/professionals/hooks/useUpdateProfessional";
import { getProfessionalByIdAdmin } from "@/repositories/professionalsRepository";
import type { Professional } from "@/features/professionals/types";

export function EditProfessionalClient() {
  const { id } = useParams<{ id: string }>();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const { update, error, isLoading } = useUpdateProfessional(id);

  useEffect(() => {
    getProfessionalByIdAdmin(id).then((data) => {
      setProfessional(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>;
  }
  if (!professional) {
    return <p className="text-sm text-red-500">Profesional no encontrado.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-navy">Editar profesional</h1>
      <ProfessionalForm
        mode="edit"
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
        }}
        onSubmit={async (values) => {
          await update(values);
        }}
        isLoading={isLoading}
        error={error}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
