"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSubmitReview } from "@/features/reviews/hooks/useSubmitReview";

const REDIRECT_SECONDS = 10;

function ReviewSuccess() {
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
      <p className="font-medium">¡Gracias por tu calificación!</p>
      <p>Nos ayuda a mejorar la red de profesionales.</p>
      <p className="mt-2 text-green-700">Te vamos a redirigir al inicio en {secondsLeft}s.</p>
      <Button className="mt-3" size="sm" onClick={() => router.push("/")}>
        Volver al inicio
      </Button>
    </div>
  );
}

export function ReviewForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { submit, error, success, isLoading } = useSubmitReview();

  if (success) {
    return <ReviewSuccess />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return;
    await submit(token, rating, comment);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div className="grid gap-2">
        <Label>Puntaje</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} estrellas`}
            >
              <Star
                className="size-6"
                fill={n <= rating ? "#eab308" : "none"}
                stroke={n <= rating ? "#eab308" : "#d1d5db"}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="comment">Comentario (opcional)</Label>
        <textarea
          id="comment"
          rows={4}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isLoading || rating < 1}>
        {isLoading ? "Enviando..." : "Enviar calificación"}
      </Button>
    </form>
  );
}
