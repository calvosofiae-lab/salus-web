// Los números se guardan como dígitos locales sin código de país (ej: "3411234567" para
// Argentina, "666155767" para España). El país elegido determina cuántos dígitos se
// esperan y cómo se arma el link internacional `wa.me`: código de país + prefijo de
// móvil si el país lo exige (Argentina exige un "9" extra antes del número local para
// líneas móviles; España no tiene ese prefijo adicional).
export interface PhoneCountry {
  code: string;
  label: string;
  dialCode: string;
  mobilePrefix: string;
  numberLength: number;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "AR", label: "Argentina (+54)", dialCode: "54", mobilePrefix: "9", numberLength: 10 },
  { code: "ES", label: "España (+34)", dialCode: "34", mobilePrefix: "", numberLength: 9 },
];

export const DEFAULT_PHONE_COUNTRY = "AR";

export function getPhoneCountry(code: string | null | undefined): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.code === code) ?? PHONE_COUNTRIES[0];
}

export function sanitizePhoneDigits(value: string, countryCode: string): string {
  const country = getPhoneCountry(countryCode);
  return value.replace(/\D/g, "").slice(0, country.numberLength);
}

export function isValidPhoneNumber(digits: string, countryCode: string): boolean {
  const country = getPhoneCountry(countryCode);
  return digits.length === country.numberLength;
}

export function buildWhatsappLink(rawNumber: string, countryCode: string, message: string): string {
  const country = getPhoneCountry(countryCode);
  const digits = sanitizePhoneDigits(rawNumber, countryCode);
  return `https://wa.me/${country.dialCode}${country.mobilePrefix}${digits}?text=${encodeURIComponent(message)}`;
}
