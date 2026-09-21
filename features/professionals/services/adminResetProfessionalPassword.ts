"use server";

import { getServerSession } from "@/features/auth/services/sessionService";
import { createAdminClient } from "@/lib/supabase/admin";

export async function adminResetProfessionalPassword(
  professionalId: string,
  newPassword: string,
) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    throw new Error("No autorizado.");
  }

  if (newPassword.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const admin = createAdminClient();

  const { data: professional, error: professionalError } = await admin
    .from("professionals")
    .select("profile_id")
    .eq("id", professionalId)
    .single();

  if (professionalError) throw professionalError;
  if (!professional.profile_id) {
    throw new Error("El profesional no tiene un usuario de acceso vinculado.");
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(professional.profile_id, {
    password: newPassword,
  });
  if (updateError) throw updateError;
}
