"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/actions/favorites";
import { Icon } from "@/components/ui/icon";

export function FavoriteButton({
  tripId,
  initialFavorited,
  loggedIn,
}: {
  tripId: string;
  initialFavorited: boolean;
  loggedIn: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
      onClick={() => {
        if (!loggedIn) {
          router.push(`/entrar?callbackUrl=${encodeURIComponent(`/viagem/${tripId}`)}`);
          return;
        }
        startTransition(async () => {
          const res = await toggleFavoriteAction(tripId);
          if ("favorited" in res) setFavorited(res.favorited);
        });
      }}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        favorited
          ? "border-amber-deep bg-amber/15 text-amber-deep"
          : "border-line bg-sand-card text-ink/70 hover:border-amber-deep hover:text-amber-deep"
      }`}
    >
      <Icon name="heart" size={16} className={favorited ? "fill-amber-deep" : ""} />
      {favorited ? "Salvo" : "Salvar"}
    </button>
  );
}
