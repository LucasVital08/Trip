import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getTripRoutePath } from "@/lib/trip-route";
import { computeBookingPrice } from "@/lib/pricing";
import { formatBRL, formatBRLCompact } from "@/lib/money";
import { formatDateLong, formatDuration, formatTime } from "@/lib/dates";
import { startConversationAction } from "@/actions/messages";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { TierBadge, VerifiedBadge } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { RoadDivider } from "@/components/ui/road-divider";
import { RouteMap } from "@/components/trip/route-map";
import { FavoriteButton } from "@/components/trip/favorite-button";
import { VehicleGallery } from "@/components/trip/vehicle-gallery";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ publicada?: string }>;
}) {
  const { id } = await params;
  const { publicada } = await searchParams;
  const user = await getCurrentUser();

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: { include: { photos: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } },
      amenities: { include: { amenity: true }, orderBy: { amenity: { sortOrder: "asc" } } },
      driver: {
        select: {
          id: true,
          name: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          identityStatus: true,
          driverRatingAvg: true,
          driverRatingCount: true,
        },
      },
    },
  });
  if (!trip) notFound();

  const [reviews, favorite, driverTripCount, route] = await Promise.all([
    prisma.review.findMany({
      where: { targetId: trip.driverId, direction: "PASSENGER_TO_DRIVER" },
      include: { author: { select: { name: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    user
      ? prisma.favorite.findUnique({ where: { userId_tripId: { userId: user.id, tripId: id } } })
      : null,
    prisma.trip.count({ where: { driverId: trip.driverId, status: "COMPLETED" } }),
    getTripRoutePath(trip),
  ]);

  const price1 = computeBookingPrice(trip.pricePerSeatCents, 1);
  const isOwnTrip = user?.id === trip.driverId;
  const bookable = trip.status === "PUBLISHED" && trip.seatsAvailable > 0 && trip.departAt > new Date();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {publicada && (
          <p role="status" className="mb-6 rounded-2xl border border-trust/25 bg-trust/8 px-4 py-3 text-sm font-semibold text-trust">
            🎉 Viagem publicada! Ela já aparece nas buscas — compartilhe com quem vai na sua direção.
          </p>
        )}

        {/* título */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold capitalize text-amber-deep">{formatDateLong(trip.departAt)}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              {trip.originCity}
              <span className="mx-3 text-amber" aria-hidden="true">→</span>
              {trip.destCity}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TierBadge tier={trip.tier} />
              {trip.status === "CANCELLED" && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-900">Cancelada</span>
              )}
              {trip.status === "COMPLETED" && (
                <span className="rounded-full bg-ink/8 px-2.5 py-0.5 text-xs font-bold text-ink/60">Concluída</span>
              )}
            </div>
          </div>
          <FavoriteButton tripId={trip.id} initialFavorited={Boolean(favorite)} loggedIn={Boolean(user)} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* coluna principal */}
          <div className="space-y-8">
            {/* trajeto */}
            <section className="rounded-3xl border border-line bg-sand-card p-6 shadow-card">
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Trajeto</h2>
              <div className="mt-4 flex gap-4">
                <div className="flex flex-col items-center pt-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-amber-deep" />
                  <span className="w-px flex-1 border-l-2 border-dashed border-amber/70" />
                  <span className="h-3 w-3 rounded-full bg-amber-deep" />
                </div>
                <div className="flex flex-1 flex-col gap-6">
                  <div>
                    <p className="text-lg font-bold tabular-nums">
                      {formatTime(trip.departAt)}
                      <span className="ml-2">{trip.originCity}, {trip.originState}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink/60">
                      <Icon name="pin" size={14} className="text-amber-deep" />
                      Embarque: {trip.meetingPoint}
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                    {formatDuration(trip.durationMin)} de estrada · {trip.distanceKm} km
                  </p>
                  <div>
                    <p className="text-lg font-bold tabular-nums">
                      {formatTime(trip.arriveEstAt)}
                      <span className="ml-2">{trip.destCity}, {trip.destState}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink/60">
                      <Icon name="pin" size={14} className="text-amber-deep" />
                      {trip.dropoffPoint ? `Desembarque: ${trip.dropoffPoint}` : "Desembarque a combinar no chat"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <RouteMap
                  origin={{ lat: trip.meetingLat ?? trip.originLat, lng: trip.meetingLng ?? trip.originLng, label: trip.originCity }}
                  dest={{ lat: trip.dropoffLat ?? trip.destLat, lng: trip.dropoffLng ?? trip.destLng, label: trip.destCity }}
                  path={route}
                />
                <p className="mt-2 text-xs text-ink/45">
                  Horário de chegada estimado. O trajeto em detalhe (paradas, ponto exato) é combinado com o motorista pelo chat.
                </p>
              </div>
            </section>

            {/* motorista */}
            <section className="rounded-3xl border border-line bg-sand-card p-6 shadow-card">
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Quem dirige</h2>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Avatar name={trip.driver.name} src={trip.driver.avatarUrl} size={64} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-lg font-bold">
                    {trip.driver.name}
                    {trip.driver.identityStatus === "VERIFIED" && <VerifiedBadge />}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/60">
                    <Stars rating={trip.driver.driverRatingAvg} count={trip.driver.driverRatingCount} />
                    <span>{driverTripCount} {driverTripCount === 1 ? "viagem concluída" : "viagens concluídas"}</span>
                    <span>No Trip desde {trip.driver.createdAt.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
              {trip.notes && (
                <blockquote className="mt-4 rounded-2xl bg-amber/10 px-4 py-3 text-sm leading-relaxed text-ink/80">
                  <span className="font-bold text-amber-deep">Recado da viagem: </span>
                  “{trip.notes}”
                </blockquote>
              )}
              {trip.driver.bio && (
                <p className="mt-3 text-sm leading-relaxed text-ink/65">{trip.driver.bio}</p>
              )}
              {user && !isOwnTrip && (
                <form action={startConversationAction} className="mt-4">
                  <input type="hidden" name="tripId" value={trip.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink/75 transition hover:border-amber-deep hover:text-amber-deep"
                  >
                    <Icon name="message" size={15} />
                    Conversar com {trip.driver.name.split(" ")[0]}
                  </button>
                </form>
              )}
            </section>

            {/* carro e opcionais */}
            <section className="rounded-3xl border border-line bg-sand-card p-6 shadow-card">
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>O carro e a experiência</h2>
              <div className="mt-4">
                <VehicleGallery
                  photos={trip.vehicle.photos.map((photo) => ({ id: photo.id, url: photo.url }))}
                  vehicleName={`${trip.vehicle.brand} ${trip.vehicle.model}`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-ink/75">
                <span className="inline-flex items-center gap-2">
                  <Icon name="car" size={17} className="text-amber-deep" />
                  {trip.vehicle.brand} {trip.vehicle.model} {trip.vehicle.year} · {trip.vehicle.color}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Icon name="users" size={17} className="text-amber-deep" />
                  {trip.seatsAvailable} de {trip.seatsTotal} lugares livres
                </span>
              </div>
              {trip.amenities.length > 0 ? (
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {trip.amenities.map(({ amenity }) => (
                    <li key={amenity.slug} className="flex items-start gap-3 rounded-2xl bg-sand px-3.5 py-2.5">
                      <Icon name={amenity.icon} size={18} className="mt-0.5 shrink-0 text-amber-deep" />
                      <div>
                        <p className="text-sm font-semibold">{amenity.label}</p>
                        {amenity.description && <p className="text-xs text-ink/55">{amenity.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-ink/55">
                  Viagem sem opcionais declarados — o essencial, pelo menor preço.
                </p>
              )}
            </section>

            {/* avaliações */}
            <section className="rounded-3xl border border-line bg-sand-card p-6 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Avaliações de passageiros
                </h2>
                <Stars rating={trip.driver.driverRatingAvg} count={trip.driver.driverRatingCount} size={18} />
              </div>
              {reviews.length === 0 ? (
                <p className="mt-4 text-sm text-ink/55">
                  Este motorista ainda não recebeu avaliações. Todo mundo começa em algum lugar — o selo de identidade verificada vale desde a primeira viagem.
                </p>
              ) : (
                <ul className="mt-5 space-y-5">
                  {reviews.map((r) => (
                    <li key={r.id} className="border-b border-line pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.author.name} src={r.author.avatarUrl} size={36} />
                        <div>
                          <p className="text-sm font-bold">{r.author.name}</p>
                          <p className="text-xs text-ink/45">
                            {r.createdAt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                        <span className="ml-auto inline-flex items-center gap-1 text-sm font-bold">
                          <Icon name="star" size={14} className="fill-amber-deep text-amber-deep" />
                          {r.rating}
                        </span>
                      </div>
                      {r.comment && <p className="mt-2.5 text-sm leading-relaxed text-ink/75">{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* barra de reserva */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-line bg-sand-card p-6 shadow-card-hover">
              <p className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">{formatBRLCompact(trip.pricePerSeatCents)}</span>
                <span className="text-sm text-ink/55">por pessoa</span>
              </p>

              <div className="mt-4 space-y-2 rounded-2xl bg-sand px-4 py-3 text-sm">
                <p className="flex justify-between">
                  <span className="text-ink/65">Valor do motorista</span>
                  <span className="font-semibold tabular-nums">{formatBRL(price1.subtotalCents)}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-ink/65">Taxa de serviço Trip</span>
                  <span className="font-semibold tabular-nums">{formatBRL(price1.serviceFeeCents)}</span>
                </p>
                <div className="road-stripe-subtle" />
                <p className="flex justify-between text-base">
                  <span className="font-bold">Total (1 pessoa)</span>
                  <span className="font-extrabold tabular-nums">{formatBRL(price1.totalCents)}</span>
                </p>
              </div>

              <p className="mt-3 flex items-center gap-2 text-xs text-ink/55">
                <Icon name="users" size={14} />
                {trip.seatsAvailable} {trip.seatsAvailable === 1 ? "lugar disponível" : "lugares disponíveis"}
              </p>

              {isOwnTrip ? (
                <Link
                  href={`/motorista/viagens/${trip.id}`}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-sand-card transition hover:bg-ink-2"
                >
                  Gerenciar minha viagem
                </Link>
              ) : bookable ? (
                <Link
                  href={`/viagem/${trip.id}/reservar`}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-bold text-ink transition hover:bg-amber-deep"
                >
                  Reservar assento
                  <Icon name="arrow-right" size={16} />
                </Link>
              ) : (
                <p className="mt-5 rounded-2xl bg-ink/5 px-4 py-3 text-center text-sm font-semibold text-ink/50">
                  {trip.status === "CANCELLED"
                    ? "Viagem cancelada pelo motorista"
                    : trip.seatsAvailable === 0
                      ? "Lotada — todos os lugares reservados"
                      : "Reservas encerradas"}
                </p>
              )}

              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink/50">
                <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-trust" />
                Pagamento retido pela plataforma e repassado ao motorista só depois da viagem. Cancelamento com reembolso até 24h antes.
              </p>
            </div>

            <div className="mt-4 rounded-3xl border border-line bg-sand-card p-5 text-sm text-ink/65 shadow-card">
              <p className="flex items-center gap-2 font-bold text-ink">
                <Icon name="alert" size={15} className="text-amber-deep" />
                Combinados são no chat
              </p>
              <p className="mt-1.5 leading-relaxed">
                Mantenha conversa e pagamento dentro do Trip. É o que garante o
                reembolso, o suporte e a cobertura das ferramentas de segurança.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <RoadDivider />
      <Footer />
    </div>
  );
}
