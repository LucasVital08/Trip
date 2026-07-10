import { prisma } from "@/lib/prisma";
import { notify } from "@/providers/notifications";

/**
 * Serviço de reservas compartilhado entre as server actions e o webhook de
 * pagamento (este arquivo não importa nada de auth/sessão de propósito).
 */

/** Confirmação pós-pagamento: status, payout em custódia (HELD) e avisos. */
export async function confirmBooking(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: { include: { driver: true } }, passenger: true, payment: true },
  });
  if (!booking || booking.status !== "PENDING_PAYMENT") return;

  await prisma.$transaction([
    prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } }),
    prisma.payout.upsert({
      where: { bookingId },
      create: {
        bookingId,
        driverId: booking.trip.driverId,
        amountCents: booking.subtotalCents,
        status: "HELD",
      },
      update: {},
    }),
  ]);

  notify({
    kind: "booking.confirmed",
    to: { email: booking.passenger.email, name: booking.passenger.name },
    subject: `Reserva confirmada — ${booking.trip.originCity} → ${booking.trip.destCity}`,
    body: `Sua reserva ${booking.code} está confirmada. Ponto de encontro: ${booking.trip.meetingPoint}.`,
  });
  notify({
    kind: "booking.created",
    to: { email: booking.trip.driver.email, name: booking.trip.driver.name },
    subject: `Novo passageiro na sua viagem ${booking.trip.originCity} → ${booking.trip.destCity}`,
    body: `${booking.passenger.name} reservou ${booking.seats} assento(s). Reserva ${booking.code}.`,
  });
}

/** Expira a reserva e devolve os assentos à viagem. */
export async function expireBooking(bookingId: string, reason: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "EXPIRED", cancelledAt: new Date(), cancelReason: reason },
    }),
    prisma.trip.update({
      where: { id: booking.tripId },
      data: { seatsAvailable: { increment: booking.seats } },
    }),
  ]);
}
