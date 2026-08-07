"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Home, Loader2, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSubmitReview } from "@/features/reviews/hooks/useSubmitReview";

const REDIRECT_SECONDS = 10;
const textareaClassName =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

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
    <div
      role="status"
      aria-live="polite"
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200 flex flex-col items-center gap-3 rounded-xl border border-brand-teal/40 bg-brand-teal/5 p-6 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-teal text-white">
        <CheckCircle2 className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-lg font-semibold text-primary">¡Gracias por tu calificación!</p>
        <p className="text-sm text-muted-foreground">Nos ayuda a mejorar la red de profesionales.</p>
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

export function ReviewForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState(false);
  const { submit, error, success, isLoading } = useSubmitReview();
  const isSubmittingRef = useRef(false);

  if (success) {
    return <ReviewSuccess />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    if (rating < 1) {
      setRatingError(true);
      return;
    }
    isSubmittingRef.current = true;
    try {
      await submit(token, rating, comment);
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label id="rating-label">Puntaje</Label>
        <div
          role="radiogroup"
          aria-labelledby="rating-label"
          aria-describedby={ratingError ? "rating-error" : undefined}
          className="flex gap-1"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === rating}
              onClick={() => {
                setRating(n);
                setRatingError(false);
              }}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${n} estrellas`}
              className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Star
                className="size-7"
                fill={n <= (hoverRating || rating) ? "#eab308" : "none"}
                stroke={n <= (hoverRating || rating) ? "#eab308" : "#d1d5db"}
              />
            </button>
          ))}
        </div>
        {ratingError && (
          <p id="rating-error" role="alert" className="text-sm text-red-600">
            Elegí un puntaje de 1 a 5 estrellas.
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="comment">Comentario (opcional)</Label>
        <textarea
          id="comment"
          rows={4}
          placeholder="Contanos cómo fue tu experiencia..."
          className={textareaClassName}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {isLoading ? "Enviando..." : "Enviar calificación"}
      </Button>
    </form>
  );
}
