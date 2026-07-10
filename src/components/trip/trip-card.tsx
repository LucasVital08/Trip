import Link from "next/link";
import type { TripCardData } from "@/lib/search";
import { formatBRLCompact } from "@/lib/money";
import { formatDateShort, formatDuration, formatTime } from "@/lib/dates";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { TierBadge, VerifiedBadge, AmenityChip } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";

/** Card de viagem na lista de resultados. */
export function TripCard({ trip, showDate = true }: { trip: TripCardData; showDate?: boolean }) {
  const amenities = [...trip.amenities].sort(
    (a, b) => a.amenity.sortOrder - b.amenity.sortOrder
  );
  const visible = amenities.slice(0, 4);
  const extra = amenities.length - visible.length;

  return (
    <article className="group relative rounded-2xl border border-line bg-sand-card p-4 shadow-card transition hover:shadow-card-hover sm:p-5">
      <Link
        href={`/viagem/${trip.id}`}
        className="absolute inset-0 z-10 rounded-2xl"
        aria-label={`${trip.originCity} para ${trip.destCity}, ${formatTime(trip.departAt)}, ${formatBRLCompact(trip.pricePerSeatCents)} por pessoa, com ${trip.driver.name}`}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        {/* horários e rota */}
        <div className="flex flex-1 gap-4">
          <div className="flex flex-col items-center pt-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-amber-deep" />
            <span className="w-px flex-1 border-l-2 border-dashed border-amber/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-deep" />
          </div>
          <div className="flex flex-1 flex-col justify-between gap-2">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-lg font-bold tabular-nums">{formatTime(trip.departAt)}</span>
              <span className="font-semibold">{trip.originCity}</span>
              <span className="text-xs text-ink/45">{trip.originState}</span>
            </p>
            <p className="pl-0 text-xs font-medium text-ink/45">
              {formatDuration(trip.durationMin)} · {trip.distanceKm} km
              {showDate && <> · {formatDateShort(trip.departAt)}</>}
            </p>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-lg font-bold tabular-nums">{formatTime(trip.arriveEstAt)}</span>
              <span className="font-semibold">{trip.destCity}</span>
              <span className="text-xs text-ink/45">{trip.destState}</span>
            </p>
          </div>
        </div>

        {/* preço */}
        <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-line sm:pl-5">
          <TierBadge tier={trip.tier} />
          <div className="text-right">
            <p className="text-2xl font-extrabold tracking-tight text-ink">
              {formatBRLCompact(trip.pricePerSeatCents)}
            </p>
            <p className="text-xs text-ink/50">por pessoa</p>
          </div>
        </div>
      </div>

      <div className="road-stripe-subtle my-4" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={trip.driver.name} src={trip.driver.avatarUrl} size={40} />
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              {trip.driver.name}
              {trip.driver.identityStatus === "VERIFIED" && <VerifiedBadge />}
            </p>
            <Stars rating={trip.driver.driverRatingAvg} count={trip.driver.driverRatingCount} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-ink/55">
          <Icon name="car" size={15} className="text-ink/40" />
          {trip.vehicle.brand} {trip.vehicle.model} · {trip.vehicle.year}
          <span aria-hidden="true">·</span>
          <Icon name="users" size={15} className="text-ink/40" />
          {trip.seatsAvailable} {trip.seatsAvailable === 1 ? "lugar" : "lugares"}
        </div>
      </div>

      {visible.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visible.map(({ amenity }) => (
            <AmenityChip key={amenity.slug} icon={amenity.icon} label={amenity.label} />
          ))}
          {extra > 0 && (
            <span className="inline-flex items-center rounded-full border border-line bg-sand px-2.5 py-1 text-xs font-medium text-ink/55">
              +{extra}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
