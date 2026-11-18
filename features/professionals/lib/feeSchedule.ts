export interface FeeScheduleItem {
  label: string;
  price: number;
}

/** Fila del formulario: el precio viaja como string, igual que consultation_fee. */
export interface FeeScheduleFormRow {
  label: string;
  price: string;
}

export const FEE_LABEL_SUGGESTIONS = [
  "Terapia de pareja",
  "Terapia familiar",
  "Primera consulta",
  "Orientación a padres",
  "Sesión extendida",
];

// fee_schedule es jsonb: se valida al leer para que una fila mal cargada a mano en la base no
// rompa el perfil público.
export function parseFeeSchedule(value: unknown): FeeScheduleItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is FeeScheduleItem =>
      typeof item?.label === "string" &&
      item.label.trim() !== "" &&
      typeof item?.price === "number" &&
      Number.isFinite(item.price),
  );
}

export function feeScheduleToFormRows(value: unknown): FeeScheduleFormRow[] {
  return parseFeeSchedule(value).map((item) => ({ label: item.label, price: String(item.price) }));
}

// Filas totalmente vacías se descartan (el usuario agregó una y no la completó); las demás ya
// pasaron por la validación del schema.
export function formRowsToFeeSchedule(rows: FeeScheduleFormRow[]): FeeScheduleItem[] {
  return rows
    .filter((row) => row.label.trim() !== "" || row.price.trim() !== "")
    .map((row) => ({ label: row.label.trim(), price: Number(row.price) }));
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-AR")}`;
}
