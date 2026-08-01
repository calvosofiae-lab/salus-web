import type { Database } from "@/types/database";

export type Professional = Database["public"]["Tables"]["professionals"]["Row"];
export type ProfessionalInput = Database["public"]["Tables"]["professionals"]["Insert"];

export type Profession = "psicologo" | "psiquiatra";
export type Coverage = "particular" | "obra_social";
export type Modality = "virtual" | "presencial";

export interface ProfessionalFilters {
  profession?: Profession;
  consultationReason?: string;
  gender?: string;
  coverage?: Coverage;
  modality?: Modality;
  /** Provincia exacta (id de la tabla provinces). */
  province?: string;
  /** Ciudad exacta (name de la tabla cities); "General" = toda la provincia. */
  city?: string;
}

export interface ProfessionalFormValues {
  full_name: string;
  profession: string;
  license_number: string;
  gender: string;
  description: string;
  photo_url: string;
  whatsapp: string;
  province: string;
  city: string;
  coverage: string[];
  modality: string[];
  consultation_reasons: string[];
}

export interface ProfessionalCreateInput extends ProfessionalFormValues {
  email: string;
  password: string;
}
