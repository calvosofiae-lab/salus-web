// El profesional puede cargar una URL completa o solo su usuario (ej: "@juanperez" o
// "juanperez"). Si no viene con protocolo, se arma la URL de perfil estándar de cada red.
export function buildInstagramLink(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://instagram.com/${trimmed.replace(/^@/, "")}`;
}

export function buildLinkedinLink(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://linkedin.com/in/${trimmed.replace(/^@/, "")}`;
}
