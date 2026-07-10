"use client";

import { useActionState, useState } from "react";
import { submitReviewAction } from "@/actions/reviews";
import { FormError, SubmitButton } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";

/** Avaliação pós-viagem (mútua): estrelas 1–5 + comentário. */
export function ReviewForm({ bookingCode, targetName }: { bookingCode: string; targetName: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, formAction] = useActionState(submitReviewAction, {});

  return (
    <section className="mt-6 rounded-3xl border border-line bg-sand-card p-6 shadow-card">
      <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Como foi a viagem com {targetName}?
      </h2>
      <p className="mt-1 text-sm text-ink/55">
        Sua avaliação é pública e ajuda toda a comunidade a viajar melhor.
      </p>
      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="bookingCode" value={bookingCode} />
        <input type="hidden" name="rating" value={rating} />
        <div role="radiogroup" aria-label="Nota de 1 a 5 estrelas" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-1"
            >
              <Icon
                name="star"
                size={30}
                className={
                  n <= (hover || rating)
                    ? "fill-amber-deep text-amber-deep"
                    : "text-line"
                }
              />
            </button>
          ))}
        </div>
        <textarea
          name="comment"
          rows={3}
          maxLength={1000}
          placeholder="Conte como foi: pontualidade, direção, clima a bordo…"
          className="w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-sm placeholder:text-ink/35"
        />
        <FormError error={state.error} />
        <SubmitButton pendingText="Enviando…" className={rating === 0 ? "pointer-events-none opacity-50" : ""}>
          Enviar avaliação
        </SubmitButton>
      </form>
    </section>
  );
}
