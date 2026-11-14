import { createClient } from "@/lib/supabase/server";
import { getOwnProfessionalCached } from "@/features/professionals/services/getOwnProfessionalCached";
import { formatLicense } from "@/features/professionals/lib/license";
import { MODALITY_LABELS, PROFESSION_LABELS } from "@/features/professionals/constants";
import { getDefaultAvatar } from "@/lib/avatar";
import { getSiteUrl } from "@/lib/siteUrl";
import { AdvertisingScreen } from "@/features/advertising/components/AdvertisingScreen";
import type { StoryProfessional } from "@/features/advertising/lib/story";

// "Psicólogo/a" según el género cargado en el perfil; sin género queda el genérico.
function professionLabel(profession: string, gender: string | null): string {
  if (profession === "psicologo") {
    if (gender === "mujer") return "Psicóloga";
    if (gender === "hombre") return "Psicólogo";
  }
  return PROFESSION_LABELS[profession] ?? profession;
}

function modalityLine(modality: string[], city: string | null): string {
  const labels = modality.map((m) => MODALITY_LABELS[m] ?? m);
  const text =
    labels.length > 1
      ? `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1].toLowerCase()}`
      : (labels[0] ?? "");
  const place = modality.includes("presencial") && city && city !== "General" ? city : "";
  return [text && `Atención ${text.toLowerCase()}`, place].filter(Boolean).join(" · ");
}

export default async function AdvertisingPage() {
  const supabase = await createClient();
  const professional = await getOwnProfessionalCached(supabase);

  // El layout ya filtra este caso y no renderiza children sin perfil; esto es solo para TS.
  if (!professional) return null;

  // Solo datos planos hacia el componente cliente.
  const data: StoryProfessional = {
    id: professional.id,
    fullName: professional.full_name,
    professionLabel: professionLabel(professional.profession, professional.gender),
    license: formatLicense(professional),
    modalityLine: modalityLine(professional.modality, professional.city),
    photoUrl: professional.photo_url || getDefaultAvatar(professional.gender),
    profileUrl: `${getSiteUrl()}/profesionales/${professional.id}`,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Publicidad</h1>
        <p className="text-sm text-muted-foreground">
          Armá una historia de Instagram con tu foto y tus horarios, descargala en PNG y subila con
          el enlace a tu perfil para que te reserven.
        </p>
      </div>
      <AdvertisingScreen professional={data} />
    </div>
  );
}
