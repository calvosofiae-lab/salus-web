// Tipos del esquema de Supabase, tipados a mano para que coincidan exactamente con las
// migraciones aplicadas en supabase/migrations/. Se puede reemplazar en cualquier momento
// por la salida real de `supabase gen types typescript` una vez que el CLI esté vinculado
// al proyecto (ver docs/backlog/00-fundamentos.md, tarea E0-3).
//
// Se amplía a medida que se aplican nuevas migraciones (professionals, appointments, etc.).
// Deliberadamente NO incluye la tabla legacy `profesionales`: esa tabla se sigue consultando
// sin tipar hasta que se retire (E0-9).

export type UserRole = "admin" | "professional";
export type AppointmentStatus = "reservado" | "realizado" | "cancelado" | "no_asistio";

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
        Relationships: [];
      };
      professionals: {
        Row: {
          id: string;
          profile_id: string | null;
          full_name: string;
          profession: string;
          license_number: string | null;
          license_type: string;
          license_province: string | null;
          gender: string | null;
          description: string | null;
          photo_url: string | null;
          whatsapp: string | null;
          whatsapp_country: string;
          instagram_url: string | null;
          linkedin_url: string | null;
          coverage: string[];
          modality: string[];
          consultation_reasons: string[];
          province: string | null;
          city: string | null;
          is_active: boolean;
          is_premium: boolean;
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
          license_type?: string;
          license_province?: string | null;
          gender?: string | null;
          description?: string | null;
          photo_url?: string | null;
          whatsapp?: string | null;
          whatsapp_country?: string;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          coverage?: string[];
          modality?: string[];
          consultation_reasons?: string[];
          province?: string | null;
          city?: string | null;
          is_active?: boolean;
          is_premium?: boolean;
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
          license_type?: string;
          license_province?: string | null;
          gender?: string | null;
          description?: string | null;
          photo_url?: string | null;
          whatsapp?: string | null;
          whatsapp_country?: string;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          coverage?: string[];
          modality?: string[];
          consultation_reasons?: string[];
          province?: string | null;
          city?: string | null;
          is_active?: boolean;
          is_premium?: boolean;
          average_rating?: number | null;
          gender_trained?: boolean | null;
          consultation_fee?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      availability_rules: {
        Row: {
          id: string;
          professional_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      availability_blocks: {
        Row: {
          id: string;
          professional_id: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          start_date?: string;
          end_date?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          professional_id: string;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status: AppointmentStatus;
          patient_first_name: string;
          patient_last_name: string;
          patient_whatsapp: string;
          patient_whatsapp_country: string;
          patient_email: string | null;
          rating_token: string | null;
          reviewed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status?: AppointmentStatus;
          patient_first_name: string;
          patient_last_name: string;
          patient_whatsapp: string;
          patient_whatsapp_country?: string;
          patient_email?: string | null;
          rating_token?: string | null;
          reviewed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          appointment_date?: string;
          start_time?: string;
          end_time?: string;
          status?: AppointmentStatus;
          patient_first_name?: string;
          patient_last_name?: string;
          patient_whatsapp?: string;
          patient_whatsapp_country?: string;
          patient_email?: string | null;
          rating_token?: string | null;
          reviewed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          appointment_id: string;
          professional_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          professional_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          professional_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      provinces: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      cities: {
        Row: {
          id: string;
          province_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          province_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          province_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_available_slots: {
        Args: { p_professional_id: string; p_date: string };
        Returns: { start_time: string }[];
      };
      book_appointment: {
        Args: {
          p_professional_id: string;
          p_date: string;
          p_start_time: string;
          p_first_name: string;
          p_last_name: string;
          p_whatsapp: string;
          p_whatsapp_country?: string;
        };
        Returns: string;
      };
      reschedule_appointment: {
        Args: { p_appointment_id: string; p_new_date: string; p_new_start_time: string };
        Returns: void;
      };
      submit_review: {
        Args: { p_token: string; p_rating: number; p_comment: string | null };
        Returns: void;
      };
      get_featured_professional_of_month: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      get_premium_professionals: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["professionals"]["Row"][];
      };
      get_review_context: {
        Args: { p_token: string };
        Returns: {
          patient_first_name: string;
          appointment_date: string;
          start_time: string;
          professional_full_name: string;
          professional_photo_url: string | null;
          professional_profession: string;
          professional_license_number: string | null;
          professional_license_type: string | null;
          professional_license_province: string | null;
          professional_gender: string | null;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      appointment_status: AppointmentStatus;
    };
    CompositeTypes: Record<never, never>;
  };
}
