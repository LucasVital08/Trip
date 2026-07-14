import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/session";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Icon } from "@/components/ui/icon";
import { TierBadge } from "@/components/ui/badges";
import { Stars } from "@/components/ui/stars";
import { TripManageActions } from "@/components/driver/trip-manage-actions";

export const metadata: Metadata = { title: "Viagens que publiquei" };
export const dynamic = "force-dynamic";

export default async function DriverDashboardPage() {
  const { user } = await requireDriver("/motorista");

  const [trips, payoutAgg, heldAgg, pendingReviewsCount] = await Promise.all([
    prisma.trip.findMany({
      where: { driverId: user.id },
      include: {
        _count: { select: { bookings: { where: { status: { in: ["CONFIRMED", "COMPLETED"] } } } } },
      },
      orderBy: { departAt: "desc" },
      take: 30,
    }),
    prisma.payout.aggregate({
      where: { driverId: user.id, status: { in: ["RELEASED", "PAID"] } },
      _sum: { amountCents: true },
    }),
    prisma.payout.aggregate({
      where: { driverId: user.id, status: "HELD" },
      _sum: { amountCents: true },
    }),
    prisma.booking.count({
      where: {
        trip: { driverId: user.id },
        status: "COMPLETED",
        reviews: { none: { authorId: user.id } },
      },
    }),
  ]);

  const now = new Date();
  const upcoming = trips.filter((t) => t.departAt > now && (t.status === "PUBLISHED" || t.status === "FULL"));
  const toComplete = trips.filter((t) => t.departAt <= now && (t.status === "PUBLISHED" || t.status === "FULL" || t.status === "IN_PROGRESS"));
  const past = trips.filter((t) => !upcoming.includes(t) && !toComplete.includes(t));

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Viagens que publiquei
            </h1>
            <p className="mt-1 flex items-center gap-3 text-ink/60">
              Olá, {user.name.split(" ")[0]}!
              {user.driverRatingCount > 0 && <Stars rating={user.driverRatingAvg} count={user.driverRatingCount} />}
            </p>
          </div>
          <Link
            href="/motorista/publicar"
            className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-amber-deep"
          >
            <Icon name="route" size={16} />
            Publicar viagem
          </Link>
        </div>

        {/* métricas */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MetricCard icon="wallet" label="Ganhos liberados" value={formatBRL(payoutAgg._sum.amountCents ?? 0)} href="/motorista/ganhos" />
          <MetricCard icon="clock" label="Em custódia (repasse pós-viagem)" value={formatBRL(heldAgg._sum.amountCents ?? 0)} href="/motorista/ganhos" />
          <MetricCard icon="car" label="Meus veículos" value="Gerenciar" href="/motorista/veiculos" />
        </div>

        {pendingReviewsCount > 0 && (
          <p className="mt-4 rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm font-semibold text-ink/75">
            ★ Você tem {pendingReviewsCount} {pendingReviewsCount === 1 ? "passageiro para avaliar" : "passageiros para avaliar"} — abra a viagem concluída para avaliar.
          </p>
        )}

        {toComplete.length > 0 && (
          <Section title="Aguardando conclusão">
            {toComplete.map((t) => (
              <TripRow key={t.id} t={t} action={<TripManageActions tripId={t.id} canComplete />}
              />
            ))}
          </Section>
        )}

        <Section title="Próximas viagens">
          {upcoming.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-sand-card px-5 py-8 text-center text-sm text-ink/55">
              Nenhuma viagem publicada. Vai pegar estrada? Publique os lugares livres.
            </p>
          ) : (
            upcoming.map((t) => <TripRow key={t.id} t={t} />)
          )}
        </Section>

        {past.length > 0 && (
          <Section title="Histórico">
            {past.slice(0, 10).map((t) => (
              <TripRow key={t.id} t={t} />
            ))}
          </Section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function MetricCard({ icon, label, value, href }: { icon: string; label: string; value: string; href: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-line bg-sand-card p-5 shadow-card transition hover:shadow-card-hover">
      <Icon name={icon} size={20} className="text-amber-deep" />
      <p className="mt-2 text-xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-ink/45">{label}</p>
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink/50">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

const TRIP_STATUS: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: "Publicada", cls: "bg-trust/12 text-trust" },
  FULL: { label: "Lotada", cls: "bg-amber/20 text-amber-deep" },
  IN_PROGRESS: { label: "Em andamento", cls: "bg-amber/20 text-amber-deep" },
  COMPLETED: { label: "Concluída", cls: "bg-ink/8 text-ink/60" },
  CANCELLED: { label: "Cancelada", cls: "bg-red-100 text-red-900" },
};

function TripRow({
  t,
  action,
}: {
  t: {
    id: string;
    originCity: string;
    destCity: string;
    departAt: Date;
    status: string;
    tier: "ECONOMICO" | "CONFORTO" | "PREMIUM";
    seatsTotal: number;
    seatsAvailable: number;
    pricePerSeatCents: number;
    _count: { bookings: number };
  };
  action?: React.ReactNode;
}) {
  const chip = TRIP_STATUS[t.status];
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-sand-card p-4 shadow-card sm:p-5">
      <div className="min-w-0 flex-1">
        <Link href={`/motorista/viagens/${t.id}`} className="font-bold hover:underline">
          {t.originCity} <span className="text-amber-deep" aria-hidden="true">→</span> {t.destCity}
        </Link>
        <p className="mt-0.5 text-sm text-ink/55">
          {formatDateTime(t.departAt)} · {t._count.bookings} {t._count.bookings === 1 ? "reserva" : "reservas"} ·{" "}
          {t.seatsAvailable}/{t.seatsTotal} livres · {formatBRL(t.pricePerSeatCents)}/assento
        </p>
      </div>
      <TierBadge tier={t.tier} />
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${chip.cls}`}>{chip.label}</span>
      {action}
    </div>
  );
}
