import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";

export default function AdminAccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-navy">Mi cuenta</h1>
      <ChangePasswordForm />
    </div>
  );
}
