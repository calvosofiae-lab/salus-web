"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="rounded-md border border-green-600 bg-green-50 p-4 text-sm text-green-800">
      <p className="font-medium">¡Turno reservado!</p>
      <p>
        Con {professionalName} el {date} a las {startTime.slice(0, 5)} hs.
      </p>
      <p className="mt-2 text-green-700">
        Te vamos a redirigir al inicio en {secondsLeft}s.
      </p>
      <Button className="mt-3" size="sm" onClick={() => router.push("/")}>
        Volver al inicio
      </Button>
    </div>
  );
}
