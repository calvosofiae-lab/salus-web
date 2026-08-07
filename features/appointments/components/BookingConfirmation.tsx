"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Clock, Home, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/features/appointments/lib/date";

const REDIRECT_SECONDS = 10;

export function BookingConfirmation({
  professionalName,
  date,
  startTime,
}: {
  professionalName: string;
  date: string;
  startTime: string;
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.push("/");
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, router]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200 flex flex-col items-center gap-4 rounded-xl border border-brand-teal/40 bg-brand-teal/5 p-6 text-center sm:p-8"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-teal text-white">
        <Check className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-lg font-semibold text-primary">¡Reserva confirmada!</p>
        <p className="text-sm text-muted-foreground">Tu turno fue reservado correctamente.</p>
      </div>

      <div className="flex flex-col gap-1.5 text-sm text-foreground">
        <p className="flex items-center justify-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-brand-teal" aria-hidden="true" />
          {formatLongDate(date)}
        </p>
        <p className="flex items-center justify-center gap-2">
          <Clock className="size-4 shrink-0 text-brand-teal" aria-hidden="true" />
          {startTime.slice(0, 5)} hs
        </p>
        <p className="flex items-center justify-center gap-2">
          <UserRound className="size-4 shrink-0 text-brand-teal" aria-hidden="true" />
          {professionalName}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Te vamos a redirigir al inicio en {secondsLeft}s.
      </p>
      <Button size="sm" onClick={() => router.push("/")}>
        <Home className="size-3.5" aria-hidden="true" />
        Volver al inicio
      </Button>
    </div>
  );
}
