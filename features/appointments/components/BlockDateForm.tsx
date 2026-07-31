"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvailabilityBlocks } from "@/features/appointments/hooks/useAvailabilityBlocks";

export function BlockDateForm({ professionalId }: { professionalId: string }) {
  const { blocks, status, addBlock, removeBlock } = useAvailabilityBlocks(professionalId);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    await addBlock(date, reason);
    setDate("");
    setReason("");
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Bloquear fechas específicas</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <div className="grid gap-2">
          <Label htmlFor="blocked_date">Fecha</Label>
          <Input
            id="blocked_date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reason">Motivo (opcional)</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <Button type="submit">Bloquear</Button>
      </form>
      {status === "loading" && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {status === "error" && (
        <p className="text-sm text-red-500">Error al cargar los bloqueos.</p>
      )}
      <ul className="flex flex-col gap-2">
        {blocks.map((block) => (
          <li
            key={block.id}
            className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
          >
            <span>
              {block.blocked_date}
              {block.reason ? ` — ${block.reason}` : ""}
            </span>
            <button type="button" className="text-red-500" onClick={() => removeBlock(block.id)}>
              Quitar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
