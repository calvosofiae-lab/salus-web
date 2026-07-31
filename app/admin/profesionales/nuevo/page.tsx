"use client";

import { ProfessionalForm } from "@/features/professionals/components/ProfessionalForm";
import { useCreateProfessional } from "@/features/professionals/hooks/useCreateProfessional";

export default function NewProfessionalPage() {
  const { create, error, isLoading } = useCreateProfessional();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nuevo profesional</h1>
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
    </div>
  );
}
