"use client";

import { ProfessionalForm } from "@/features/professionals/components/ProfessionalForm";
import { useUpdateOwnProfile } from "@/features/professionals/hooks/useUpdateOwnProfile";
import type { Professional } from "@/features/professionals/types";

export function OwnProfileForm({ professional }: { professional: Professional }) {
  const { update, error, success, isLoading } = useUpdateOwnProfile(professional.id);

  return (
    <>
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
          whatsapp_country: professional.whatsapp_country,
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
      {success && <p className="text-sm text-green-600">Perfil actualizado correctamente.</p>}
    </>
  );
}
