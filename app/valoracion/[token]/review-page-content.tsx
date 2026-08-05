import { createClient } from "@/lib/supabase/server";
import { PROFESSION_LABELS } from "@/features/professionals/constants";
import { ReviewForm } from "@/features/reviews/components/ReviewForm";
import { getDefaultAvatar } from "@/lib/avatar";
import { SiteHeader } from "@/components/salus/site-header";
import "@/app/salus.css";

export async function ReviewPageContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: context, error } = await supabase
    .rpc("get_review_context", { p_token: token })
    .single();

  if (error || !context) {
    return (
      <>
        <div className="salus salus--header-only">
          <SiteHeader />
        </div>
        <div className="max-w-md mx-auto p-6">
          <p className="text-sm text-red-500">
            {error?.message ?? "No pudimos cargar los datos de este turno."}
          </p>
        </div>
      </>
    );
  }

  const profesionLabel =
    PROFESSION_LABELS[context.professional_profession] ?? context.professional_profession;
  const [year, month, day] = context.appointment_date.split("-");
  const fecha = `${day}/${month}/${year}`;
  const hora = context.start_time.slice(0, 5);

  return (
    <>
      <div className="salus">
        <SiteHeader />
      </div>
      <div className="max-w-md mx-auto p-6 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-brand-navy">Calificá tu turno</h1>

        <div className="flex items-center gap-4 rounded-lg border p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={context.professional_photo_url || getDefaultAvatar(context.professional_gender)}
            alt={context.professional_full_name}
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-medium">{context.professional_full_name}</span>
            <span className="text-sm text-muted-foreground">
              {profesionLabel}
              {context.professional_license_number
                ? ` (M.N. ${context.professional_license_number})`
                : ""}
            </span>
            <span className="text-sm text-muted-foreground">
              Turno del {fecha} a las {hora}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Hola {context.patient_first_name}, contanos cómo fue tu experiencia.
        </p>

        <ReviewForm token={token} />
      </div>
    </>
  );
}
