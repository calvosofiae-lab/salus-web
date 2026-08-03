import { CreateProfessionalForm } from "@/features/professionals/components/CreateProfessionalForm";

export default function NewProfessionalPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-navy">Nuevo profesional</h1>
      <CreateProfessionalForm />
    </div>
  );
}
