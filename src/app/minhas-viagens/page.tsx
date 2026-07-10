import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Minhas viagens" };
export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Aguardando pagamento", cls: "bg-amber/20 text-amber-deep" },
  CONFIRMED: { label: "Confirmada", cls: "bg-trust/12 text-trust" },
  COMPLETED: { label: "Concluída", cls: "bg-ink/8 text-ink/60" },
  CANCELLED_BY_PASSENGER: { label: "Cancelada", cls: "bg-red-100 text-red-900" },
  CANCELLED_BY_DRIVER: { label: "Cancelada pelo motorista", cls: "bg-red-100 text-red-900" },
  EXPIRED: { label: "Expirada", cls: "bg-ink/8 text-ink/50" },
};

export default async function MyTripsPage() {
  const user = await requireUser("/minhas-viagens");

  const bookings = await prisma.booking.findMany({
    where: { passengerId: user.id },
    include: {
      trip: { include: { driver: { select: { name: true, avatarUrl: true } } } },
      reviews: { where: { authorId: user.id }, select: { id: true } },
    },
    orderBy: { trip: { departAt: "desc" } },
  });

  const upcoming = bookings.filter(
    (b) => b.trip.departAt > new Date() && (b.status === "CONFIRMED" || b.status === "PENDING_PAYMENT")
  );
  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Minhas viagens
        </h1>

        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Próximas</h2>
          {upcoming.length === 0 ? (
            <div className="mt-3 rounded-3xl border border-dashed border-line bg-sand-card p-8 text-center">
              <p className="font-semibold text-ink/70">Nenhuma viagem marcada.</p>
              <Link href="/buscar" className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-ink hover:bg-amber-deep">
                <Icon name="search" size={15} /> Buscar viagem
              </Link>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {upcoming.map((b) => (
                <BookingRow key={b.id} b={b} />
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Histórico</h2>
            <div className="mt-3 space-y-3">
              {past.map((b) => (
                <BookingRow key={b.id} b={b} showReviewHint={b.status === "COMPLETED" && b.reviews.length === 0} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function BookingRow({
  b,
  showReviewHint = false,
}: {
  b: {
    code: string;
    status: string;
    seats: number;
    totalCents: number;
    trip: {
      originCity: string;
      destCity: string;
      departAt: Date;
      driver: { name: string; avatarUrl: string | null };
    };
  };
  showReviewHint?: boolean;
}) {
  const chip = STATUS_CHIP[b.status];
  return (
    <Link
      href={`/reserva/${b.code}`}
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-sand-card p-4 shadow-card transition hover:shadow-card-hover sm:p-5"
    >
      <Avatar name={b.trip.driver.name} src={b.trip.driver.avatarUrl} size={44} />
      <div className="min-w-0 flex-1">
        <p className="font-bold">
          {b.trip.originCity} <span className="text-amber-deep" aria-hidden="true">→</span> {b.trip.destCity}
        </p>
        <p className="mt-0.5 text-sm text-ink/55">
          {formatDateTime(b.trip.departAt)} · com {b.trip.driver.name} · {b.seats}{" "}
          {b.seats === 1 ? "assento" : "assentos"} · {formatBRL(b.totalCents)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {showReviewHint && (
          <span className="rounded-full bg-amber/20 px-3 py-1 text-xs font-bold text-amber-deep">Avaliar ★</span>
        )}
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${chip.cls}`}>{chip.label}</span>
      </div>
    </Link>
  );
}
