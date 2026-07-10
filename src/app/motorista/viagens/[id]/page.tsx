import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/session";
import { formatBRL } from "@/lib/money";
import { formatDateLong, formatTime } from "@/lib/dates";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { TierBadge } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { TripManageActions } from "@/components/driver/trip-manage-actions";
import { ReviewForm } from "@/components/booking/review-form";

export const dynamic = "force-dynamic";

const BOOKING_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Aguardando pagamento", cls: "bg-amber/20 text-amber-deep" },
  CONFIRMED: { label: "Confirmada", cls: "bg-trust/12 text-trust" },
  COMPLETED: { label: "Concluída", cls: "bg-ink/8 text-ink/60" },
  CANCELLED_BY_PASSENGER: { label: "Cancelada pelo passageiro", cls: "bg-red-100 text-red-900" },
  CANCELLED_BY_DRIVER: { label: "Cancelada", cls: "bg-red-100 text-red-900" },
  EXPIRED: { label: "Expirada", cls: "bg-ink/8 text-ink/50" },
};

export default async function DriverTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireDriver(`/motorista/viagens/${id}`);

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          passenger: {
            select: { id: true, name: true, avatarUrl: true, passengerRatingAvg: true, passengerRatingCnt: true, identityStatus: true },
          },
          payment: true,
          reviews: { where: { authorId: user.id }, select: { id: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!trip || trip.driverId !== user.id) notFound();

  const now = new Date();
  const activeBookings = trip.bookings.filter((b) => ["CONFIRMED", "PENDING_PAYMENT", "COMPLETED"].includes(b.status));
  const expectedCents = activeBookings
    .filter((b) => b.status !== "PENDING_PAYMENT")
    .reduce((s, b) => s + b.subtotalCents, 0);
  const canComplete = trip.departAt <= now && ["PUBLISHED", "FULL", "IN_PROGRESS"].includes(trip.status);
  const canCancel = trip.departAt > now && ["PUBLISHED", "FULL"].includes(trip.status);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <Link href="/motorista" className="text-sm font-semibold text-amber-deep hover:underline">
          ← Painel do motorista
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold capitalize text-amber-deep">{formatDateLong(trip.departAt)}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {trip.originCity} <span className="text-amber" aria-hidden="true">→</span> {trip.destCity}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-ink/60">
              <TierBadge tier={trip.tier} />
              <span>Saída {formatTime(trip.departAt)}</span>
              <span>{formatBRL(trip.pricePerSeatCents)}/assento</span>
              <span>{trip.seatsAvailable}/{trip.seatsTotal} livres</span>
            </p>
          </div>
          <Link href={`/viagem/${trip.id}`} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5">
            Ver como passageiro
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-line bg-sand-card p-5 shadow-card">
            <Icon name="wallet" size={18} className="text-amber-deep" />
            <p className="mt-1.5 text-xl font-extrabold">{formatBRL(expectedCents)}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">
              Repasse desta viagem (após conclusão)
            </p>
          </div>
          <div className="flex items-center rounded-3xl border border-line bg-sand-card p-5 shadow-card">
            <TripManageActions tripId={trip.id} canComplete={canComplete} canCancel={canCancel} />
            {!canComplete && !canCancel && (
              <p className="text-sm text-ink/55">
                {trip.status === "COMPLETED" ? "Viagem concluída — repasses liberados." : trip.status === "CANCELLED" ? "Viagem cancelada." : "A viagem ainda não aconteceu."}
              </p>
            )}
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">
            Passageiros ({activeBookings.length})
          </h2>
          {trip.bookings.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-line bg-sand-card px-5 py-8 text-center text-sm text-ink/55">
              Nenhuma reserva ainda. Compartilhe o link da viagem!
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {trip.bookings.map((b) => {
                const chip = BOOKING_LABEL[b.status];
                return (
                  <div key={b.id} className="rounded-2xl border border-line bg-sand-card p-4 shadow-card sm:p-5">
                    <div className="flex flex-wrap items-center gap-4">
                      <Avatar name={b.passenger.name} src={b.passenger.avatarUrl} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{b.passenger.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-ink/55">
                          <Stars rating={b.passenger.passengerRatingAvg} count={b.passenger.passengerRatingCnt} />
                          <span>{b.seats} {b.seats === 1 ? "assento" : "assentos"}</span>
                          <span>reserva {b.code}</span>
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${chip.cls}`}>{chip.label}</span>
                    </div>
                    {b.status === "COMPLETED" && b.reviews.length === 0 && (
                      <div className="mt-3">
                        <ReviewForm bookingCode={b.code} targetName={b.passenger.name.split(" ")[0]} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
