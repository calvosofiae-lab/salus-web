import { addDaysIso } from "@/features/appointments/lib/date";

/**
 * Historias de Instagram para que el profesional publicite sus horarios. Adaptado del módulo de
 * publicidad de Panadería Castillo: solo formato historia (1080 × 1920) y descarga en PNG, con
 * los colores de SALUS y la foto del profesional. Nada se inventa: los horarios salen de la
 * agenda (turnos libres de la semana o los horarios de atención configurados).
 */

// ---------------------------------------------------------------------------------------------
// Datos de entrada (serializables: viajan del Server Component a la pantalla cliente).

export interface StoryProfessional {
  id: string;
  fullName: string;
  /** "Psicóloga", "Psiquiatra", etc. Ya resuelto según el género. */
  professionLabel: string;
  license: string;
  /** "Virtual y presencial · Rosario" o similar. */
  modalityLine: string;
  photoUrl: string;
  /** Enlace absoluto al perfil público, donde el paciente reserva. */
  profileUrl: string;
}

// ---------------------------------------------------------------------------------------------
// Formato

/**
 * Historia de Instagram. `safeTop`/`safeBottom`: Instagram tapa ~250 px arriba (perfil, barra de
 * progreso) y ~260 abajo (responder, enviar); ahí no va nada importante.
 */
export const STORY_FORMAT = {
  name: "Historia de Instagram",
  w: 1080,
  h: 1920,
  safeTop: 250,
  safeBottom: 260,
} as const;

/** Colores de SALUS (tailwind.config.ts: brand.*). */
export const SALUS_COLORS = {
  navy: "#1b2f48",
  teal: "#669a8b",
  tealDark: "#4d8172",
  yellow: "#e2b05c",
  cream: "#faf7f2",
  white: "#ffffff",
} as const;

export const LOGO_SRC = "/logo-salus.png";

// ---------------------------------------------------------------------------------------------
// Qué se publicita

export type StoryKind = "week" | "schedule";
export type WeekChoice = "current" | "next";

export const STORY_KINDS: Record<StoryKind, { name: string; detail: string }> = {
  week: {
    name: "Turnos de la semana",
    detail: "Los horarios libres que tenés para reservar, día por día.",
  },
  schedule: {
    name: "Agenda general",
    detail: "Tus horarios de atención, como están configurados en tu agenda.",
  },
};

/** Una fila de la historia: el día y lo que se muestra al lado (horarios o franjas). */
export interface StoryRow {
  label: string;
  sublabel?: string;
  values: string[];
  /** Horarios que no entraron (se muestra "+N"). */
  hidden: number;
}

export interface StoryTexts {
  title: string;
  subtitle: string;
}

/** SALUS no atiende domingos (igual que WeeklyAvailabilityForm): lunes a sábado. */
export const WORK_DAYS = [
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
] as const;

/**
 * Horarios por día que se muestran (contando el "+N"): con pocos días entran dos renglones de
 * horarios por día; con más, uno solo, para que la letra no quede ilegible en el celular. El
 * resto se resume en "+N" (en el perfil, al tocar el enlace, el paciente ve todos).
 */
function maxChipsPerDay(days: number): number {
  return days <= 3 ? 10 : 6;
}

/** "09:00:00" -> "9:00". */
export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  return `${Number(h)}:${m}`;
}

/** Lunes de la semana de `isoDate` (YYYY-MM-DD). */
export function mondayOf(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay(); // 0 = domingo
  return addDaysIso(isoDate, weekday === 0 ? -6 : 1 - weekday);
}

/**
 * Días (lunes a sábado) de la semana elegida que todavía no pasaron. En la semana actual arranca
 * en `today`; un domingo, la semana actual ya no tiene días hábiles por delante.
 */
export function weekDates(today: string, week: WeekChoice): string[] {
  const monday = addDaysIso(mondayOf(today), week === "next" ? 7 : 0);
  return WORK_DAYS.map((_, i) => addDaysIso(monday, i)).filter((d) => d >= today);
}

export function formatDayMonth(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${Number(d)}/${Number(m)}`;
}

/** Día abreviado ("Mié"): en la vista semanal va con la fecha al lado, en un solo renglón. */
function weekdayShort(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return WORK_DAYS.find((w) => w.value === dow)?.short ?? "";
}

/** Filas de "Turnos de la semana": solo los días con algún horario libre. */
export function weekRows(slotsByDate: Record<string, string[]>, dates: string[]): StoryRow[] {
  const withSlots = dates.filter((date) => (slotsByDate[date] ?? []).length > 0);
  const max = maxChipsPerDay(withSlots.length);
  return withSlots.map((date) => {
    const slots = slotsByDate[date].map(formatTime);
    // Si no entran todos, el último lugar es para el "+N".
    const values = slots.length > max ? slots.slice(0, max - 1) : slots;
    return {
      label: weekdayShort(date),
      sublabel: formatDayMonth(date),
      values,
      hidden: slots.length - values.length,
    };
  });
}

/** Filas de "Agenda general": franjas de cada día según las reglas semanales de la agenda. */
export function scheduleRows(
  rules: { day_of_week: number; start_time: string; end_time: string }[],
): StoryRow[] {
  return WORK_DAYS.map((day) => ({
    label: day.label,
    values: rules
      .filter((r) => r.day_of_week === day.value)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((r) => `${formatTime(r.start_time)} a ${formatTime(r.end_time)}`),
    hidden: 0,
  })).filter((row) => row.values.length > 0);
}

export function defaultTexts(kind: StoryKind, week: WeekChoice, p: StoryProfessional): StoryTexts {
  if (kind === "schedule") {
    return { title: "Mis horarios de atención", subtitle: p.modalityLine };
  }
  return {
    title: week === "current" ? "Turnos disponibles esta semana" : "Turnos de la semana que viene",
    subtitle: "Reservá online en pocos pasos.",
  };
}

/** Texto para acompañar la historia (o pegar en otra red), con el enlace para reservar. */
export function shareText(texts: StoryTexts, p: StoryProfessional): string {
  return [
    `${texts.title} 🗓️`,
    `${p.fullName} · ${p.professionLabel}`,
    "",
    `Reservá tu turno online: ${p.profileUrl}`,
  ].join("\n");
}

export function fileName(kind: StoryKind, p: StoryProfessional): string {
  const base = `${p.fullName} ${kind === "week" ? "turnos de la semana" : "horarios de atencion"}`
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  return `salus-${base}.png`;
}
