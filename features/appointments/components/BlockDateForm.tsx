"use client";

import { useRef, useState } from "react";
import { CalendarOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvailabilityBlocks } from "@/features/appointments/hooks/useAvailabilityBlocks";
import { formatLongDate } from "@/features/appointments/lib/date";

export function BlockDateForm({ professionalId }: { professionalId: string }) {
  const { blocks, status, error, isSaving, addBlock, removeBlock } =
    useAvailabilityBlocks(professionalId);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const isSubmittingRef = useRef(false);

  // Al elegir "Desde", "Hasta" lo sigue mientras no se haya elegido un "Hasta" propio (o
  // quedó antes que el nuevo "Desde") -- así bloquear un solo día no pide tocar dos campos.
  function handleStartDateChange(value: string) {
    setStartDate(value);
    if (!endDate || endDate < value) setEndDate(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current || isSaving || !startDate || !endDate) return;
    isSubmittingRef.current = true;
    try {
      const success = await addBlock(startDate, endDate, reason);
      if (success) {
        setStartDate("");
        setEndDate("");
        setReason("");
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-brand-navy">Bloquear fechas específicas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Por ejemplo, feriados o licencias. Esos días no se ofrecerán turnos.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor="block_start_date">Desde</Label>
            <Input
              id="block_start_date"
              type="date"
              className="h-9"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="block_end_date">Hasta</Label>
            <Input
              id="block_end_date"
              type="date"
              className="h-9"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Input
              id="reason"
              className="h-9"
              placeholder="Ej: Feriado, licencia"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSaving || !startDate || !endDate} aria-busy={isSaving}>
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CalendarOff className="size-4" aria-hidden="true" />
            )}
            Bloquear
          </Button>
        </form>
        {status === "loading" && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            Error al cargar los bloqueos.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {blocks.length > 0 && (
          <div className="flex flex-col divide-y rounded-md border">
            {blocks.map((block) => (
              <div key={block.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>
                  {block.start_date === block.end_date
                    ? formatLongDate(block.start_date)
                    : `${formatLongDate(block.start_date)} al ${formatLongDate(block.end_date)}`}
                  {block.reason ? ` — ${block.reason}` : ""}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                  disabled={isSaving}
                  onClick={() => removeBlock(block.id)}
                >
                  <X className="size-3" aria-hidden="true" />
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
