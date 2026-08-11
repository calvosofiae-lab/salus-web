export const PROFESSION_OPTIONS = [
  { value: "psicologo", label: "Psicólogo/a" },
  { value: "psiquiatra", label: "Psiquiatra" },
] as const;

export const MODALITY_OPTIONS = [
  { value: "virtual", label: "Virtual" },
  { value: "presencial", label: "Presencial" },
] as const;

export const COVERAGE_OPTIONS = [
  { value: "particular", label: "Particular" },
  { value: "obra_social", label: "Obra social" },
] as const;

export const GENDER_OPTIONS = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
] as const;

export const LICENSE_TYPE_OPTIONS = [
  { value: "nacional", label: "Matrícula Nacional" },
  { value: "provincial", label: "Matrícula Provincial" },
] as const;

export const CONSULTATION_REASONS = [
  "Adolescentes",
  "Psicología infantil",
  "Adultos general",
  "Adultos mayores",
  "Pareja",
  "Orientación vocacional",
  "Trastornos de la conducta alimentaria",
  "Consumo problemático",
  "Sexualidad y género",
  "Transición de género",
  "Violencia de género",
  "Neurodivergencias",
];

export const PROFESSION_LABELS: Record<string, string> = Object.fromEntries(
  PROFESSION_OPTIONS.map((o) => [o.value, o.label]),
);

export const MODALITY_LABELS: Record<string, string> = Object.fromEntries(
  MODALITY_OPTIONS.map((o) => [o.value, o.label]),
);

export const GENDER_LABELS: Record<string, string> = Object.fromEntries(
  GENDER_OPTIONS.map((o) => [o.value, o.label]),
);
