"use client";

import { ProfessionalForm } from "@/features/professionals/components/ProfessionalForm";
import { useUpdateProfessional } from "@/features/professionals/hooks/useUpdateProfessional";
import type { Professional } from "@/features/professionals/types";

export function EditProfessionalForm({ professional }: { professional: Professional }) {
  const { update, error, isLoading } = useUpdateProfessional(professional.id);

  return (
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
  );
}
