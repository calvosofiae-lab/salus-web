export function getDefaultAvatar(gender: string | null): string {
  return gender === "hombre" ? "/avatar-hombre.svg" : "/avatar-mujer.svg";
}
