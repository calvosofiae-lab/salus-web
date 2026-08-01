"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvailabilityBlocks } from "@/features/appointments/hooks/useAvailabilityBlocks";

export function BlockDateForm({ professionalId }: { professionalId: string }) {
  const { blocks, status, error, isSaving, addBlock, removeBlock } =
    useAvailabilityBlocks(professionalId);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    const success = await addBlock(date, reason);
    if (success) {
      setDate("");
      setReason("");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-navy">
        Bloquear fechas específicas
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="blocked_date">Fecha</Label>
          <Input
            id="blocked_date"
            type="date"
            className="h-9"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="reason">Motivo (opcional)</Label>
          <Input
            id="reason"
            className="h-9"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isSaving}>
          Bloquear
        </Button>
      </form>
      {status === "loading" && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {status === "error" && (
        <p className="text-sm text-red-500">Error al cargar los bloqueos.</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {blocks.length > 0 && (
        <div className="flex flex-col divide-y rounded-md border">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <span>
                {block.blocked_date}
                {block.reason ? ` — ${block.reason}` : ""}
              </span>
              <button
                type="button"
                className="text-xs text-red-500 hover:underline disabled:opacity-50"
                disabled={isSaving}
                onClick={() => removeBlock(block.id)}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
