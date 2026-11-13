// Exporta a PDF solo el reporte "Sesiones por semana", tal como se ve en pantalla (mismo rango
// de semanas, mismo filtro de activos/inactivos y mismo orden). jsPDF se importa recién al
// exportar para no sumarlo al bundle de la página.

export interface WeeklyBookingsPdfProfessional {
  fullName: string;
  counts: number[];
  web: number[];
  agenda: number[];
  cancelled: number[];
  total: number;
}

export interface WeeklyBookingsPdfData {
  // Encabezado de cada columna de semana (ej. "03/11" o "Esta sem.").
  weekLabels: string[];
  // Índice de la semana actual dentro del rango, o -1 si no está.
  currentWeekIndex: number;
  rangeLabel: string;
  filterLabel: string;
  professionals: WeeklyBookingsPdfProfessional[];
  fileName: string;
}

const NAVY: [number, number, number] = [27, 47, 72];
const TEAL_LIGHT: [number, number, number] = [232, 240, 238];
const RED: [number, number, number] = [220, 38, 38];
const MUTED: [number, number, number] = [150, 150, 150];

export async function exportWeeklyBookingsPdf(data: WeeklyBookingsPdfData): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const marginX = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text("Sesiones por semana", marginX, 18);

  const generatedAt = new Date().toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });
  const withoutSessions = data.professionals.filter((p) => p.total === 0).length;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Semanas: ${data.rangeLabel}   ·   Profesionales: ${data.filterLabel}   ·   Generado: ${generatedAt}`,
    marginX,
    25,
  );
  doc.text(
    withoutSessions === 0
      ? "Todos los profesionales tienen al menos una sesión en estas semanas."
      : `${withoutSessions} ${
          withoutSessions === 1 ? "profesional sin" : "profesionales sin"
        } sesiones en estas semanas.`,
    marginX,
    31,
  );

  const weekCount = data.weekLabels.length;

  autoTable(doc, {
    startY: 36,
    margin: { left: marginX, right: marginX },
    head: [["Profesional", ...data.weekLabels, "Total"]],
    body: data.professionals.map((p) => [
      p.total === 0 ? `${p.fullName}  (sin sesiones)` : p.fullName,
      ...p.counts.map((count, i) => {
        // Detalle por origen debajo del número, como el tooltip de la pantalla.
        const detail = `web ${p.web[i]} · agenda ${p.agenda[i]}`;
        const cancelled = p.cancelled[i] > 0 ? `\ncanc. ${p.cancelled[i]}` : "";
        return count === 0 && p.cancelled[i] === 0 ? "0" : `${count}\n${detail}${cancelled}`;
      }),
      String(p.total),
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2, valign: "middle" },
    headStyles: { fillColor: NAVY, textColor: 255, halign: "center" },
    columnStyles: {
      0: { halign: "left", cellWidth: 70 },
      [weekCount + 1]: { halign: "center", fontStyle: "bold" },
    },
    didParseCell: (hook) => {
      const col = hook.column.index;
      const isWeekCol = col >= 1 && col <= weekCount;
      if (hook.section === "head") {
        if (col === 0) hook.cell.styles.halign = "left";
        return;
      }
      if (hook.section !== "body") return;
      const p = data.professionals[hook.row.index];
      if (isWeekCol) {
        hook.cell.styles.halign = "center";
        if (col - 1 === data.currentWeekIndex) hook.cell.styles.fillColor = TEAL_LIGHT;
        if (p.counts[col - 1] === 0) hook.cell.styles.textColor = MUTED;
      }
      if (p.total === 0 && (col === 0 || col === weekCount + 1)) {
        hook.cell.styles.textColor = RED;
      }
    },
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Nota aclaratoria debajo de la tabla; si no entra en la página, va a una nueva.
  const tableEnd =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 36;
  let noteY = tableEnd + 8;
  if (noteY > pageHeight - 22) {
    doc.addPage();
    noteY = 18;
  }
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Sesiones no canceladas por semana (lunes a domingo) según la fecha del turno: reservadas por " +
      "pacientes en la web (web) y cargadas por el profesional en su agenda (agenda); las canceladas " +
      "(canc.) se cuentan aparte. Las semanas futuras muestran los turnos ya agendados.",
    marginX,
    noteY,
    { maxWidth: pageWidth - marginX * 2 },
  );

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - marginX, pageHeight - 8, {
      align: "right",
    });
  }

  doc.save(data.fileName);
}
