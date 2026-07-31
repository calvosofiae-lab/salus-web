"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSubmitReview } from "@/features/reviews/hooks/useSubmitReview";

export function ReviewForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { submit, error, success, isLoading } = useSubmitReview();

  if (success) {
    return (
      <p className="text-sm text-green-700">
        ¡Gracias por tu calificación! Nos ayuda a mejorar la red de profesionales.
      </p>
    );
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
