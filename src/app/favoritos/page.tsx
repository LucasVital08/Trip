import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { TRIP_CARD_INCLUDE } from "@/lib/search";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TripCard } from "@/components/trip/trip-card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Favoritos" };
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await requireUser("/favoritos");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { trip: { include: TRIP_CARD_INCLUDE } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Favoritos
        </h1>
        <p className="mt-1 text-ink/60">Viagens que você salvou para decidir com calma.</p>

        {favorites.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-line bg-sand-card p-10 text-center">
            <Icon name="heart" size={36} className="mx-auto text-ink/25" />
            <p className="mt-3 font-semibold text-ink/70">Nada salvo ainda.</p>
            <p className="mt-1 text-sm text-ink/55">Toque em “Salvar” em qualquer viagem para guardá-la aqui.</p>
            <Link href="/buscar" className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-ink hover:bg-amber-deep">
              <Icon name="search" size={15} /> Buscar viagens
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {favorites.map((f) => (
              <TripCard key={f.tripId} trip={f.trip} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
