"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { MODALITY_LABELS, PROFESSION_LABELS } from "@/features/professionals/constants";
import type { Professional } from "@/features/professionals/types";
import { SlotPicker, type SlotPickerHandle } from "@/features/appointments/components/SlotPicker";
import { BookingForm, type PatientValues } from "@/features/appointments/components/BookingForm";
import { BookingConfirmation } from "@/features/appointments/components/BookingConfirmation";
import { useBookAppointment } from "@/features/appointments/hooks/useBookAppointment";
import { RatingSummary } from "@/features/reviews/components/RatingSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDefaultAvatar } from "@/lib/avatar";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/whatsapp";

const EMPTY_PATIENT_VALUES: PatientValues = {
  firstName: "",
  lastName: "",
  whatsappCountry: DEFAULT_PHONE_COUNTRY,
  whatsappArea: "",
  whatsappNumber: "",
};

export function ProfessionalProfile({ professional }: { professional: Professional }) {
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);
  // Vive acá (no en BookingForm) para que sobreviva si el usuario vuelve a "Cambiar fecha" u
  // "Cambiar horario" -- esos pasos desmontan y remontan el formulario de datos.
  const [patientValues, setPatientValues] = useState<PatientValues>(EMPTY_PATIENT_VALUES);
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={professional.photo_url || getDefaultAvatar(professional.gender)}
          alt={professional.full_name}
          className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-24 sm:w-24"
        />
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold sm:text-2xl">
            {professional.full_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {profesion}
            {professional.license_number ? ` (M.N. ${professional.license_number})` : ""}
          </p>
          {modalidad && <p className="text-sm text-muted-foreground">Atención {modalidad}</p>}
          {ubicacion && <p className="text-sm text-muted-foreground">📍 {ubicacion}</p>}
          {professional.consultation_fee != null && (
            <p className="text-sm text-muted-foreground">
              Precio de la sesión: ${professional.consultation_fee.toLocaleString("es-AR")}
            </p>
          )}
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
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-6 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-primary">Reservar un turno</h2>
                <p className="text-sm text-muted-foreground">
                  Elegí el día y horario que mejor te queden.
                </p>
              </div>

              <SlotPicker
                ref={slotPickerRef}
                professionalId={professional.id}
                selectedSlot={selected}
                onSelectSlot={(date, time) => setSelected({ date, time })}
                onClearSelection={() => setSelected(null)}
              />
              {error && !selected && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              {selected && (
                <BookingForm
                  date={selected.date}
                  time={selected.time}
                  professionalName={professional.full_name}
                  modalityLabel={modalidad}
                  values={patientValues}
                  onValuesChange={setPatientValues}
                  isLoading={isLoading}
                  error={error}
                  onSubmit={async (values) => {
                    const id = await book({
                      professionalId: professional.id,
                      date: selected.date,
                      startTime: selected.time,
                      firstName: values.firstName,
                      lastName: values.lastName,
                      whatsapp: `${values.whatsappArea}${values.whatsappNumber}`,
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
            </CardContent>
          </Card>
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
