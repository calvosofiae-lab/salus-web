export interface ProfessionalReportRow {
  professional_id: string;
  full_name: string;
  is_active: boolean;
  average_rating: number | null;
  review_count: number;
  comment_count: number;
  pending_comment_count: number;
  reservado_count: number;
  realizado_count: number;
  cancelado_count: number;
  no_asistio_count: number;
}

// Una fila por profesional y semana (get_weekly_bookings_report). week_start = lunes, "YYYY-MM-DD".
export interface WeeklyBookingsRow {
  professional_id: string;
  full_name: string;
  is_active: boolean;
  week_start: string;
  session_count: number;
  web_count: number;
  agenda_count: number;
  cancelled_count: number;
}
