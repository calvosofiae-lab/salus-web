import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
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
