import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export interface PhoneCountryOption {
  code: CountryCode;
  label: string;
}

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["es"], { type: "region" })
    : null;

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = getCountries()
  .map((code) => ({
    code,
    label: `${flagEmoji(code)} ${regionNames?.of(code) ?? code} (+${getCountryCallingCode(code)})`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, "es"));

export function getPhoneCallingCode(countryCode: string): string {
  return getCountryCallingCode(countryCode as CountryCode);
}

export function sanitizeAreaDigits(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 5);
}

export function sanitizeNumberDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function isValidSplitPhone(area: string, number: string, countryCode: string): boolean {
  if (!area || !number) return false;
  return isValidPhoneNumber(`${area}${number}`, countryCode as CountryCode);
}

// Separa un número guardado como dígitos locales (área + número juntos, ej: "3411234567") en
// código de área y número, para precargarlo en los campos separados. Usa el formato nacional de
// libphonenumber ("0341 123-4567" -> "341" + "1234567"); si no lo reconoce, deja todo en el número.
export function splitPhoneDigits(
  digits: string,
  countryCode: string,
): { area: string; number: string } {
  const clean = digits.replace(/\D/g, "");
  if (!clean) return { area: "", number: "" };
  const parsed = parsePhoneNumberFromString(clean, countryCode as CountryCode);
  const [first, ...rest] = parsed?.formatNational().split(" ") ?? [];
  const area = sanitizeAreaDigits(first ?? "");
  if (!area || rest.length === 0 || !clean.startsWith(area)) return { area: "", number: clean };
  return { area, number: clean.slice(area.length) };
}

export function isPhoneCountry(code: string): boolean {
  return (getCountries() as string[]).includes(code);
}
