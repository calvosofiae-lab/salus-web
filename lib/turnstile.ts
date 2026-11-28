import "server-only";

// Verificación del captcha de Cloudflare Turnstile del lado del servidor
// (https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
//
// Si TURNSTILE_SECRET_KEY no está configurada, no se verifica: así el deploy no rompe la
// reserva antes de que las claves estén cargadas en Vercel. En producción eso queda avisado
// en los logs. Las claves van juntas: NEXT_PUBLIC_TURNSTILE_SITE_KEY (muestra el widget) y
// TURNSTILE_SECRET_KEY (lo verifica). Con solo la secreta, ninguna reserva pasaría.

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.VERCEL_ENV === "production") {
      console.warn("verifyTurnstileToken: TURNSTILE_SECRET_KEY no configurada, se omite el captcha.");
    }
    return true;
  }

  if (!token || token.length > 2048) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) {
      console.warn("verifyTurnstileToken: rechazado", data["error-codes"]);
    }
    return data.success === true;
  } catch (err) {
    // Si Cloudflare no responde no se deja pasar: la persona puede reintentar.
    console.error("verifyTurnstileToken: no se pudo verificar", err);
    return false;
  }
}
