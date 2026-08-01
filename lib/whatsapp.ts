// Los números se guardan como código de área + línea, sin el 0 del código de área
// ni el 15 de celular (ej: "3411234567"), que es el formato que ya usan los datos de
// prueba. WhatsApp necesita el formato internacional completo para armar el link
// `wa.me`: código de país (54) + el 9 que exige para líneas móviles de Argentina +
// ese número limpio (ej: "5493411234567").
const AR_WHATSAPP_PREFIX = "549";

export const WHATSAPP_NUMBER_LENGTH = 10;

export function sanitizeWhatsappDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, WHATSAPP_NUMBER_LENGTH);
}

export function isValidWhatsappNumber(digits: string): boolean {
  return digits.length === WHATSAPP_NUMBER_LENGTH;
}

export function buildWhatsappLink(rawNumber: string, message: string): string {
  const digits = sanitizeWhatsappDigits(rawNumber);
  return `https://wa.me/${AR_WHATSAPP_PREFIX}${digits}?text=${encodeURIComponent(message)}`;
}
