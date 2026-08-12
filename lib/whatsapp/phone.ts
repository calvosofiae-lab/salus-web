import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { PHONE_COUNTRIES, getPhoneCountry, sanitizePhoneDigits } from "@/lib/whatsapp";

// Mismo criterio que buildWhatsappLink en lib/whatsapp.ts (reutilizado, no
// reimplementado): para países conocidos (AR/ES) usa el dialCode + mobilePrefix de
// PHONE_COUNTRIES; para el resto (el paciente puede reservar desde cualquier país,
// ver features/appointments/lib/phone.ts) cae al código de llamada real vía
// libphonenumber-js, sin asumir prefijo de móvil.
export function toWhatsAppE164(rawNumber: string, countryCode: string): string {
  const isKnownCountry = PHONE_COUNTRIES.some((c) => c.code === countryCode);
  if (isKnownCountry) {
    const country = getPhoneCountry(countryCode);
    const digits = sanitizePhoneDigits(rawNumber, countryCode);
    return `${country.dialCode}${country.mobilePrefix}${digits}`;
  }
  const digits = rawNumber.replace(/\D/g, "");
  try {
    const dialCode = getCountryCallingCode(countryCode as CountryCode);
    return `${dialCode}${digits}`;
  } catch {
    return digits;
  }
}

// Versión "para leer" (con "+"), pensada para ir dentro del cuerpo de un mensaje de
// WhatsApp: el destinatario puede tocarla para iniciar un chat directo con el otro
// (paciente <-> profesional), sin pasar por SALUS.
export function formatPhoneForDisplay(rawNumber: string, countryCode: string): string {
  return `+${toWhatsAppE164(rawNumber, countryCode)}`;
}
