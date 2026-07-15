import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateLong, formatTime } from "@/lib/dates";
import { BrandMark } from "@/components/ui/brand";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badges";
import { RouteMap } from "@/components/trip/route-map";
import { RoadDivider } from "@/components/ui/road-divider";
import { Icon } from "@/components/ui/icon";
import { getTripRoutePath } from "@/lib/trip-route";

export const metadata: Metadata = { title: "Acompanhar viagem" };
export const dynamic = "force-dynamic";

/**
 * Página PÚBLICA de acompanhamento (link de segurança): quem recebe o link
 * vê rota, horários, carro, placa e motorista — sem precisar de conta.
 */
export default async function TrackTripPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await prisma.booking.findUnique({
    where: { shareToken: token },
    include: {
      passenger: { select: { name: true } },
      trip: {
        include: {
          driver: { select: { name: true, avatarUrl: true, identityStatus: true, driverRatingAvg: true, driverRatingCount: true } },
          vehicle: true,
        },
      },
    },
  });
  if (
    !booking ||
    !["CONFIRMED", "COMPLETED"].includes(booking.status) ||
    booking.shareRevokedAt ||
    !booking.shareExpiresAt ||
    booking.shareExpiresAt <= new Date()
  ) notFound();
  const trip = booking.trip;

  const now = new Date();
  const status =
    trip.status === "COMPLETED" || trip.arriveEstAt < now
      ? { label: "Viagem concluída", cls: "bg-trust/15 text-trust" }
      : trip.departAt <= now
        ? { label: "Em andamento", cls: "bg-amber/20 text-amber-deep" }
        : { label: "Programada", cls: "bg-ink/10 text-ink/70" };

  const route = await getTripRoutePath(trip);

  return (
    <div className="min-h-dvh bg-ink text-sand-card">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <BrandMark dark />
          <span className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${status.cls}`}>{status.label}</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          {booking.passenger.name.split(" ")[0]} está viajando de {trip.originCity} para {trip.destCity}
        </h1>
        <p className="mt-1.5 capitalize text-sand-card/60">{formatDateLong(trip.departAt)}</p>

        <div className="mt-6 overflow-hidden rounded-3xl">
          <RouteMap
            origin={{ lat: trip.meetingLat ?? trip.originLat, lng: trip.meetingLng ?? trip.originLng, label: trip.originCity }}
            dest={{ lat: trip.dropoffLat ?? trip.destLat, lng: trip.dropoffLng ?? trip.destLng, label: trip.destCity }}
            path={route}
            className="border-0"
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoTile icon="clock" label="Saída" value={`${formatTime(trip.departAt)} · ${trip.originCity}`} />
          <InfoTile icon="clock" label="Chegada estimada" value={`${formatTime(trip.arriveEstAt)} · ${trip.destCity}`} />
          <InfoTile icon="car" label="Veículo" value={`${trip.vehicle.brand} ${trip.vehicle.model} ${trip.vehicle.color}`} />
          <InfoTile icon="alert" label="Placa" value={trip.vehicle.plate} />
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-3xl bg-sand-card/5 p-5">
          <Avatar name={trip.driver.name} src={trip.driver.avatarUrl} size={52} />
          <div>
            <p className="flex flex-wrap items-center gap-2 font-bold">
              {trip.driver.name}
              {trip.driver.identityStatus === "VERIFIED" && <VerifiedBadge />}
            </p>
            <p className="mt-0.5 text-sm text-sand-card/60">
              Motorista · ★ {trip.driver.driverRatingAvg.toFixed(1)} ({trip.driver.driverRatingCount} avaliações)
            </p>
          </div>
        </div>

        <RoadDivider className="mt-8" />
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-sand-card/45">
          <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-trust" />
          Link de acompanhamento gerado pelo passageiro. Em emergência, ligue 190
          (Polícia) ou 193 (Bombeiros) informando placa e trajeto acima.
        </p>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-sand-card/5 px-4 py-3.5">
      <Icon name={icon} size={17} className="mt-0.5 shrink-0 text-amber" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-sand-card/45">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}
