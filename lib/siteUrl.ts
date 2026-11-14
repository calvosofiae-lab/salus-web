// URL pública del sitio para armar enlaces absolutos (mails, enlaces para compartir). En
// producción usa el dominio de producción; en un preview de Vercel, la URL de ese deploy.
export function getSiteUrl(): string {
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
}
