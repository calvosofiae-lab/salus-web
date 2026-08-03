"use client";

import { ProfessionalForm } from "@/features/professionals/components/ProfessionalForm";
import { useCreateProfessional } from "@/features/professionals/hooks/useCreateProfessional";

export function CreateProfessionalForm() {
  const { create, error, isLoading } = useCreateProfessional();

  return (
    <ProfessionalForm
      mode="create"
      onSubmit={async (values) => {
        await create({
          ...values,
          email: values.email ?? "",
          password: values.password ?? "",
        });
      }}
      isLoading={isLoading}
      error={error}
      submitLabel="Crear profesional"
    />
  );
}
