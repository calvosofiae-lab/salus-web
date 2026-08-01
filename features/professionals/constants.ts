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

export const CONSULTATION_REASONS = [
  "Adolescentes",
  "Psicología infantil",
  "Adultos general",
  "Orientación vocacional",
  "Trastornos de la conducta alimentaria",
  "Consumo problemático",
  "Sexualidad y género",
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

export const PROVINCIAS = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

export const CIUDADES_POR_PROVINCIA: Record<string, string[]> = {
  "Buenos Aires": [
    "La Plata",
    "Mar del Plata",
    "Bahía Blanca",
    "Tandil",
    "San Isidro",
    "Vicente López",
    "Avellaneda",
    "Quilmes",
    "Lomas de Zamora",
    "Morón",
    "San Martín",
    "Pilar",
    "Tigre",
    "Escobar",
    "Otras localidades",
  ],
  CABA: [
    "Agronomía",
    "Almagro",
    "Balvanera",
    "Belgrano",
    "Caballito",
    "Colegiales",
    "Flores",
    "La Boca",
    "Nuñez",
    "Palermo",
    "Recoleta",
    "Retiro",
    "San Telmo",
    "Villa Urquiza",
    "Otras comunas",
  ],
  Córdoba: [
    "Córdoba Capital",
    "Villa Carlos Paz",
    "Río Cuarto",
    "Villa María",
    "San Francisco",
    "Alta Gracia",
    "Otras localidades",
  ],
  "Santa Fe": [
    "Rosario",
    "Santa Fe Capital",
    "Rafaela",
    "Venado Tuerto",
    "Reconquista",
    "Otras localidades",
  ],
  Mendoza: [
    "Mendoza Capital",
    "Godoy Cruz",
    "Guaymallén",
    "San Rafael",
    "Maipú",
    "Otras localidades",
  ],
  Tucumán: ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Otras localidades"],
  Salta: ["Salta Capital", "San Ramón de la Nueva Orán", "Cafayate", "Otras localidades"],
  "Entre Ríos": ["Paraná", "Gualeguaychú", "Concordia", "Otras localidades"],
};
