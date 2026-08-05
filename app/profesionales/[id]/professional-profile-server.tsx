import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfessionalProfile } from "@/features/professionals/components/ProfessionalProfile";
import { SiteHeader } from "@/components/salus/site-header";
import "@/app/salus.css";

export async function ProfessionalProfileServer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: professional } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!professional) {
    notFound();
  }

  return (
    <>
      <div className="salus salus--header-only">
        <SiteHeader />
      </div>
      <div className="max-w-5xl mx-auto p-6">
        <ProfessionalProfile professional={professional} />
      </div>
    </>
  );
}
