import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PLATFORM } from "@/config/platform";
import { formatDateLong, formatTime } from "@/lib/dates";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badges";
import { Stars } from "@/components/ui/stars";
import { CheckoutForm } from "@/components/booking/checkout-form";

export const dynamic = "force-dynamic";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/viagem/${id}/reservar`);

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      driver: {
        select: { id: true, name: true, avatarUrl: true, identityStatus: true, driverRatingAvg: true, driverRatingCount: true },
      },
      vehicle: true,
    },
  });
  if (!trip) notFound();
  if (trip.driverId === user.id) redirect(`/motorista/viagens/${trip.id}`);
  if (trip.status !== "PUBLISHED" || trip.seatsAvailable === 0 || trip.departAt <= new Date()) {
    redirect(`/viagem/${trip.id}`);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          Confirmar reserva
        </h1>

        <div className="mt-6 rounded-3xl border border-line bg-sand-card p-5 shadow-card">
          <p className="text-sm font-semibold capitalize text-amber-deep">{formatDateLong(trip.departAt)}</p>
          <p className="mt-1 text-lg font-bold">
            {trip.originCity} <span className="text-amber" aria-hidden="true">→</span> {trip.destCity}
            <span className="ml-2 text-sm font-medium text-ink/55">saída {formatTime(trip.departAt)}</span>
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name={trip.driver.name} src={trip.driver.avatarUrl} size={38} />
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                {trip.driver.name}
                {trip.driver.identityStatus === "VERIFIED" && <VerifiedBadge />}
              </p>
              <Stars rating={trip.driver.driverRatingAvg} count={trip.driver.driverRatingCount} />
            </div>
            <p className="ml-auto text-xs text-ink/55">
              {trip.vehicle.brand} {trip.vehicle.model} · {trip.vehicle.color}
            </p>
          </div>
        </div>

        <CheckoutForm
          tripId={trip.id}
          pricePerSeatCents={trip.pricePerSeatCents}
          maxSeats={Math.min(trip.seatsAvailable, PLATFORM.maxSeatsPerBooking)}
          feePercent={PLATFORM.feePercent}
        />
      </main>
      <Footer />
    </div>
  );
}
