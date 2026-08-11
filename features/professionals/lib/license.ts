export function formatLicense(professional: {
  license_number: string | null;
  license_type: string | null;
  license_province: string | null;
}): string {
  if (!professional.license_number) return "";
  return professional.license_type === "provincial" && professional.license_province
    ? `M.P. ${professional.license_province} ${professional.license_number}`
    : `M.N. ${professional.license_number}`;
}
