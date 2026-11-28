import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

// `next` llega en la URL, así que cualquiera puede armar un link a esta ruta con el valor que
// quiera. Solo se aceptan rutas internas ("/algo"): sin esto, un link legítimo de
// salusprofesionales.com.ar podía terminar mandando a la persona a un sitio externo
// ("https://otro-sitio" o "//otro-sitio"), que es la base de un phishing creíble.
function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next);
    } else {
      // Redirige a `next` con el error en vez de a /auth/error: para el caso real que usa
      // esta ruta hoy (recupero de contraseña, next=/auth/update-password), eso reutiliza
      // la pantalla de "link inválido o expirado" que ya tiene esa página en vez de la
      // genérica en inglés de /auth/error.
      redirect(`${next}?error=${encodeURIComponent(error.message)}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect("/auth/error");
}
