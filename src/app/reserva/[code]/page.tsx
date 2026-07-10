import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatBRL } from "@/lib/money";
import { formatDateLong, formatTime } from "@/lib/dates";
import { startConversationAction } from "@/actions/messages";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { RoadDivider } from "@/components/ui/road-divider";
import { PixPanel } from "@/components/booking/pix-panel";
import { CancelBookingButton } from "@/components/booking/cancel-booking";
import { ReviewForm } from "@/components/booking/review-form";
import { ShareTripLink } from "@/components/booking/share-link";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Aguardando pagamento", cls: "bg-amber/20 text-amber-deep" },
  CONFIRMED: { label: "Confirmada", cls: "bg-trust/12 text-trust" },
  COMPLETED: { label: "Viagem concluída", cls: "bg-ink/8 text-ink/60" },
  CANCELLED_BY_PASSENGER: { label: "Cancelada por você", cls: "bg-red-100 text-red-900" },
  CANCELLED_BY_DRIVER: { label: "Cancelada pelo motorista", cls: "bg-red-100 text-red-900" },
  EXPIRED: { label: "Expirada", cls: "bg-ink/8 text-ink/50" },
};

export default async function BookingDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireUser(`/reserva/${code}`);

  const booking = await prisma.booking.findUnique({
    where: { code },
    include: {
      payment: true,
      trip: {
        include: {
          driver: { select: { id: true, name: true, avatarUrl: true, identityStatus: true } },
          vehicle: true,
        },
      },
      reviews: { where: { authorId: user.id } },
    },
  });
  if (!booking || (booking.passengerId !== user.id && booking.trip.driverId !== user.id)) notFound();

  const status = STATUS_LABEL[booking.status];
  const trip = booking.trip;
  const isPix = booking.payment?.method === "PIX";
  const awaitingPix = booking.status === "PENDING_PAYMENT" && isPix && booking.payment?.status === "PENDING";
  const canCancel = booking.status === "CONFIRMED" || booking.status === "PENDING_PAYMENT";
  const canReview = booking.status === "COMPLETED" && booking.reviews.length === 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink/50">
              Reserva <span className="font-mono font-bold text-ink">{booking.code}</span>
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              {trip.originCity} <span className="text-amber" aria-hidden="true">→</span> {trip.destCity}
            </h1>
          </div>
          <span className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${status.cls}`}>{status.label}</span>
        </div>

        {awaitingPix && booking.payment?.pixQrCode && (
          <PixPanel code={booking.code} pixCopyPaste={booking.payment.pixQrCode} totalCents={booking.totalCents} />
        )}

        {/* detalhes da viagem */}
        <section className="mt-6 rounded-3xl border border-line bg-sand-card p-6 shadow-card">
          <p className="text-sm font-semibold capitalize text-amber-deep">{formatDateLong(trip.departAt)}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <InfoItem icon="clock" label="Saída" value={`${formatTime(trip.departAt)} · ${trip.originCity}`} />
            <InfoItem icon="clock" label="Chegada estimada" value={`${formatTime(trip.arriveEstAt)} · ${trip.destCity}`} />
            <InfoItem icon="pin" label="Ponto de embarque" value={trip.meetingPoint} />
            <InfoItem icon="users" label="Assentos reservados" value={String(booking.seats)} />
            <InfoItem icon="car" label="Carro" value={`${trip.vehicle.brand} ${trip.vehicle.model} · ${trip.vehicle.color} · placa ${trip.vehicle.plate}`} />
          </div>

          <div className="road-stripe-subtle my-5" />

          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={trip.driver.name} src={trip.driver.avatarUrl} size={44} />
            <div>
              <p className="flex items-center gap-2 text-sm font-bold">
                {trip.driver.name}
                {trip.driver.identityStatus === "VERIFIED" && <VerifiedBadge />}
              </p>
              <p className="text-xs text-ink/50">Motorista</p>
            </div>
            {booking.passengerId === user.id && (
              <form action={startConversationAction} className="ml-auto">
                <input type="hidden" name="tripId" value={trip.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink/75 transition hover:border-amber-deep hover:text-amber-deep"
                >
                  <Icon name="message" size={15} />
                  Chat
                </button>
              </form>
            )}
          </div>
        </section>

        {/* pagamento */}
        <section className="mt-4 rounded-3xl border border-line bg-sand-card p-6 shadow-card">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Pagamento</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/65">Valor do motorista</dt>
              <dd className="font-semibold tabular-nums">{formatBRL(booking.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/65">Taxa de serviço Trip</dt>
              <dd className="font-semibold tabular-nums">{formatBRL(booking.serviceFeeCents)}</dd>
            </div>
            <div className="road-stripe-subtle" />
            <div className="flex justify-between text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-extrabold tabular-nums">{formatBRL(booking.totalCents)}</dd>
            </div>
            {booking.payment && (
              <p className="pt-1 text-xs text-ink/50">
                {booking.payment.method === "PIX" ? "Pix" : `Cartão •••• ${booking.payment.cardLast4 ?? ""}`}
                {booking.payment.paidAt && ` · pago em ${booking.payment.paidAt.toLocaleDateString("pt-BR")}`}
                {booking.payment.refundCents ? ` · reembolso de ${formatBRL(booking.payment.refundCents)}` : ""}
              </p>
            )}
          </dl>
        </section>

        {/* segurança: compartilhar viagem */}
        {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") && booking.shareToken && booking.passengerId === user.id && (
          <ShareTripLink shareUrl={`${appUrl}/acompanhar/${booking.shareToken}`} />
        )}

        {/* avaliação pós-viagem */}
        {canReview && (
          <ReviewForm
            bookingCode={booking.code}
            targetName={booking.passengerId === user.id ? trip.driver.name : "o passageiro"}
          />
        )}
        {booking.status === "COMPLETED" && booking.reviews.length > 0 && (
          <p className="mt-4 rounded-2xl border border-trust/25 bg-trust/8 px-4 py-3 text-sm font-semibold text-trust">
            Avaliação enviada — obrigado por fortalecer a comunidade!
          </p>
        )}

        {/* ações */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/minhas-viagens" className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink/75 hover:bg-ink/5">
            Minhas viagens
          </Link>
          {canCancel && booking.passengerId === user.id && (
            <CancelBookingButton code={booking.code} departAt={trip.departAt.toISOString()} totalCents={booking.totalCents} />
          )}
        </div>
      </main>
      <RoadDivider />
      <Footer />
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon name={icon} size={17} className="mt-0.5 shrink-0 text-amber-deep" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
