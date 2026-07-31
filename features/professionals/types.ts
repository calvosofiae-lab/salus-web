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
  location?: string;
}
