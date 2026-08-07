"use client";

import { Badge } from "@/components/ui/badge";
import { ProfessionalForm } from "@/features/professionals/components/ProfessionalForm";
import { useUpdateOwnProfile } from "@/features/professionals/hooks/useUpdateOwnProfile";
import type { Professional } from "@/features/professionals/types";

export function OwnProfileForm({ professional }: { professional: Professional }) {
  const { update, error, success, isLoading } = useUpdateOwnProfile(professional.id);

  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Tu plan:</span>
        <Badge
          variant={professional.is_premium ? "default" : "outline"}
          className={professional.is_premium ? "bg-brand-yellow text-brand-navy hover:bg-brand-yellow" : ""}
        >
          {professional.is_premium ? "Premium" : "Estándar"}
        </Badge>
        {!professional.is_premium && (
          <span className="text-xs text-muted-foreground">
            Contactá a SALUS para sumarte al plan premium.
          </span>
        )}
      </div>
      <ProfessionalForm
        mode="edit"
        initialValues={{
          full_name: professional.full_name,
          profession: professional.profession,
          license_number: professional.license_number ?? "",
          gender: professional.gender ?? "",
          consultation_fee:
            professional.consultation_fee != null ? String(professional.consultation_fee) : "",
          description: professional.description ?? "",
          photo_url: professional.photo_url ?? "",
          whatsapp: professional.whatsapp ?? "",
          whatsapp_country: professional.whatsapp_country,
          instagram_url: professional.instagram_url ?? "",
          linkedin_url: professional.linkedin_url ?? "",
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
