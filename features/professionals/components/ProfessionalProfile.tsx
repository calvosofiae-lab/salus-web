"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { MODALITY_LABELS, PROFESSION_LABELS } from "@/features/professionals/constants";
import type { Professional } from "@/features/professionals/types";
import { SlotPicker, type SlotPickerHandle } from "@/features/appointments/components/SlotPicker";
import { BookingForm } from "@/features/appointments/components/BookingForm";
import { BookingConfirmation } from "@/features/appointments/components/BookingConfirmation";
import { useBookAppointment } from "@/features/appointments/hooks/useBookAppointment";
import { RatingSummary } from "@/features/reviews/components/RatingSummary";
import { Button } from "@/components/ui/button";
import { getDefaultAvatar } from "@/lib/avatar";

export function ProfessionalProfile({ professional }: { professional: Professional }) {
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);
  const { book, error, isLoading, confirmedId } = useBookAppointment();
  const slotPickerRef = useRef<SlotPickerHandle>(null);

  const profesion = PROFESSION_LABELS[professional.profession] ?? professional.profession;
  const modalidad = professional.modality.map((m) => MODALITY_LABELS[m] ?? m).join(" y ");
  const ubicacion = professional.modality.includes("presencial")
    ? [professional.city && professional.city !== "General" ? professional.city : null, professional.province]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={professional.photo_url || getDefaultAvatar(professional.gender)}
          alt={professional.full_name}
          className="w-24 h-24 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-semibold">{professional.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {profesion}
            {professional.license_number ? ` (M.N. ${professional.license_number})` : ""}
          </p>
          {modalidad && <p className="text-sm text-muted-foreground">Atención {modalidad}</p>}
          {ubicacion && <p className="text-sm text-muted-foreground">📍 {ubicacion}</p>}
          <RatingSummary averageRating={professional.average_rating} />
        </div>
      </div>

      {professional.description && <p className="text-sm">{professional.description}</p>}

      {confirmedId ? (
        <BookingConfirmation
          professionalName={professional.full_name}
          date={selected?.date ?? ""}
          startTime={selected?.time ?? ""}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-medium">Reservar un turno</h2>
          <SlotPicker
            ref={slotPickerRef}
            professionalId={professional.id}
            selectedSlot={selected}
            onSelectSlot={(date, time) => setSelected({ date, time })}
          />
          {error && !selected && <p className="text-sm text-red-500">{error}</p>}
          {selected && (
            <BookingForm
              isLoading={isLoading}
              error={error}
              onSubmit={async (values) => {
                const id = await book({
                  professionalId: professional.id,
                  date: selected.date,
                  startTime: selected.time,
                  firstName: values.firstName,
                  lastName: values.lastName,
                  whatsapp: values.whatsapp,
                  whatsappCountry: values.whatsappCountry,
                });
                if (!id) {
                  // El turno pudo haberse ocupado entre que se cargó la lista y que se
                  // confirmó -- refresca los horarios y obliga a elegir de nuevo.
                  slotPickerRef.current?.reload();
                  setSelected(null);
                }
              }}
            />
          )}
          <Button variant="outline" asChild className="self-start">
            <Link href="/">
              <Home className="size-4" />
              Volver a inicio
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
