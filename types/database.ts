// Tipos del esquema de Supabase, tipados a mano para que coincidan exactamente con las
// migraciones aplicadas en supabase/migrations/. Se puede reemplazar en cualquier momento
// por la salida real de `supabase gen types typescript` una vez que el CLI esté vinculado
// al proyecto (ver docs/backlog/00-fundamentos.md, tarea E0-3).
//
// Se amplía a medida que se aplican nuevas migraciones (professionals, appointments, etc.).
// Deliberadamente NO incluye la tabla legacy `profesionales`: esa tabla se sigue consultando
// sin tipar hasta que se retire (E0-9).

export type UserRole = "admin" | "professional";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          created_at?: string;
        };
      };
      professionals: {
        Row: {
          id: string;
          profile_id: string | null;
          full_name: string;
          profession: string;
          license_number: string | null;
          gender: string | null;
          description: string | null;
          photo_url: string | null;
          whatsapp: string | null;
          coverage: string[];
          modality: string[];
          consultation_reasons: string[];
          location: string | null;
          is_active: boolean;
          is_featured: boolean;
          average_rating: number | null;
          gender_trained: boolean | null;
          consultation_fee: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          full_name: string;
          profession: string;
          license_number?: string | null;
          gender?: string | null;
          description?: string | null;
          photo_url?: string | null;
          whatsapp?: string | null;
          coverage?: string[];
          modality?: string[];
          consultation_reasons?: string[];
          location?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          average_rating?: number | null;
          gender_trained?: boolean | null;
          consultation_fee?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          full_name?: string;
          profession?: string;
          license_number?: string | null;
          gender?: string | null;
          description?: string | null;
          photo_url?: string | null;
          whatsapp?: string | null;
          coverage?: string[];
          modality?: string[];
          consultation_reasons?: string[];
          location?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          average_rating?: number | null;
          gender_trained?: boolean | null;
          consultation_fee?: number | null;
          created_at?: string;
        };
      };
    };
    Enums: {
      user_role: UserRole;
    };
  };
}
