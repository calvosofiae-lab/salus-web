"use server";

import { getServerSession } from "@/features/auth/services/sessionService";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfessionalCreateInput } from "@/features/professionals/types";

export async function adminCreateProfessional(input: ProfessionalCreateInput) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    throw new Error("No autorizado.");
  }

  const admin = createAdminClient();

  const { data: created, error: createUserError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (createUserError) throw createUserError;

  const userId = created.user?.id;
  if (!userId) throw new Error("No se pudo crear el usuario del profesional.");

  const { data: inserted, error: insertError } = await admin
    .from("professionals")
    .insert({
      profile_id: userId,
      full_name: input.full_name,
      profession: input.profession,
      license_number: input.license_number || null,
      gender: input.gender || null,
      description: input.description || null,
      photo_url: input.photo_url || null,
      whatsapp: input.whatsapp || null,
      whatsapp_country: input.whatsapp_country,
      coverage: input.coverage,
      modality: input.modality,
      consultation_reasons: input.consultation_reasons,
      province: input.province || null,
      city: input.city || null,
    })
    .select("id")
    .single();

  if (insertError) {
    // Evita dejar un usuario de auth huérfano si falla el insert del profesional. Si la
    // limpieza en sí falla, no lo tragamos en silencio: al menos queda logueado para poder
    // borrar el usuario a mano después.
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch (cleanupError) {
      console.error(
        `No se pudo limpiar el usuario de auth huérfano ${userId} tras un insert fallido:`,
        cleanupError,
      );
    }
    throw insertError;
  }

  return { id: inserted.id };
}
