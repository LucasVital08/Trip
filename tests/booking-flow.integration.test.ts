/**
 * Integração (usa o Postgres de dev): fluxo crítico de reserva.
 *
 *  reserva pendente (Pix) → webhook payment.paid → CONFIRMED + payout HELD
 *  reserva pendente        → webhook payment.failed → EXPIRED + assentos devolvidos
 *
 * Cada teste cria seus próprios registros e os remove ao final.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { computeBookingPrice } from "@/lib/pricing";
import { generateBookingCode, generateShareToken } from "@/lib/booking-code";
import { POST as paymentWebhook } from "@/app/api/webhooks/payment/route";
import { expireBooking } from "@/lib/booking-service";

const prisma = new PrismaClient();
const ids = { users: [] as string[], vehicles: [] as string[], trips: [] as string[], bookings: [] as string[] };

async function createFixture() {
  const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const driver = await prisma.user.create({
    data: { name: "Motorista Teste", email: `drv-${stamp}@test.dev`, identityStatus: "VERIFIED" },
  });
  const passenger = await prisma.user.create({
    data: { name: "Passageiro Teste", email: `pax-${stamp}@test.dev` },
  });
  const vehicle = await prisma.vehicle.create({
    data: { ownerId: driver.id, brand: "Fiat", model: "Argo", year: 2020, color: "Prata", plate: `TST${stamp.slice(0, 4).toUpperCase()}`, category: "HATCH", seats: 4 },
  });
  const departAt = new Date(Date.now() + 3 * 86_400_000);
  const trip = await prisma.trip.create({
    data: {
      driverId: driver.id,
      vehicleId: vehicle.id,
      originCity: "Recife",
      originState: "PE",
      originLat: -8.05,
      originLng: -34.88,
      destCity: "Caruaru",
      destState: "PE",
      destLat: -8.28,
      destLng: -35.98,
      departAt,
      arriveEstAt: new Date(departAt.getTime() + 2 * 3_600_000),
      distanceKm: 155,
      durationMin: 120,
      meetingPoint: "Derby",
      seatsTotal: 3,
      seatsAvailable: 3,
      pricePerSeatCents: 4500,
    },
  });
  ids.users.push(driver.id, passenger.id);
  ids.vehicles.push(vehicle.id);
  ids.trips.push(trip.id);
  return { driver, passenger, trip };
}

async function createPendingBooking(tripId: string, passengerId: string, seats: number) {
  const price = computeBookingPrice(4500, seats, 12, 0);
  const providerRef = `test_ref_${Math.random().toString(36).slice(2)}`;
  const booking = await prisma.$transaction(async (tx) => {
    await tx.trip.update({ where: { id: tripId }, data: { seatsAvailable: { decrement: seats } } });
    return tx.booking.create({
      data: {
        code: generateBookingCode(),
        tripId,
        passengerId,
        seats,
        status: "PENDING_PAYMENT",
        pricePerSeatCents: price.pricePerSeatCents,
        subtotalCents: price.subtotalCents,
        serviceFeeCents: price.serviceFeeCents,
        totalCents: price.totalCents,
        shareToken: generateShareToken(),
        payment: {
          create: {
            provider: "mock",
            providerRef,
            method: "PIX",
            status: "PENDING",
            amountCents: price.totalCents,
            serviceFeeCents: price.serviceFeeCents,
            driverAmountCents: price.driverAmountCents,
          },
        },
      },
    });
  });
  ids.bookings.push(booking.id);
  return { booking, providerRef };
}

function webhookRequest(type: string, providerRef: string, bookingId: string, signature = "mock-signature") {
  return new NextRequest("http://localhost:3000/api/webhooks/payment", {
    method: "POST",
    headers: { "content-type": "application/json", "x-webhook-signature": signature },
    body: JSON.stringify({ type, providerRef, bookingId }),
  });
}

describe.skipIf(!process.env.DATABASE_URL)("fluxo de reserva + confirmação por webhook", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { bookingId: { in: ids.bookings } } });
    await prisma.payout.deleteMany({ where: { bookingId: { in: ids.bookings } } });
    await prisma.payment.deleteMany({ where: { bookingId: { in: ids.bookings } } });
    await prisma.booking.deleteMany({ where: { id: { in: ids.bookings } } });
    await prisma.trip.deleteMany({ where: { id: { in: ids.trips } } });
    await prisma.vehicle.deleteMany({ where: { id: { in: ids.vehicles } } });
    await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
    await prisma.$disconnect();
  });

  it("payment.paid confirma a reserva e cria payout em custódia", async () => {
    const { trip, passenger, driver } = await createFixture();
    const { booking, providerRef } = await createPendingBooking(trip.id, passenger.id, 2);

    const res = await paymentWebhook(webhookRequest("payment.paid", providerRef, booking.id));
    expect(res.status).toBe(200);

    const updated = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: { payment: true, payout: true },
    });
    expect(updated.status).toBe("CONFIRMED");
    expect(updated.payment?.status).toBe("PAID");
    expect(updated.payout?.status).toBe("HELD");
    expect(updated.payout?.amountCents).toBe(9000); // 2 × 4500, repasse integral
    expect(updated.payout?.driverId).toBe(driver.id);
    // fotografia de preço: total = 9000 + 5% = 9450
    expect(updated.totalCents).toBe(9450);

    const t = await prisma.trip.findUniqueOrThrow({ where: { id: trip.id } });
    expect(t.seatsAvailable).toBe(1);
  });

  it("payment.failed expira a reserva e devolve os assentos", async () => {
    const { trip, passenger } = await createFixture();
    const { booking, providerRef } = await createPendingBooking(trip.id, passenger.id, 1);

    const res = await paymentWebhook(webhookRequest("payment.failed", providerRef, booking.id));
    expect(res.status).toBe(200);

    const updated = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: { payment: true, payout: true },
    });
    expect(updated.status).toBe("EXPIRED");
    expect(updated.payment?.status).toBe("FAILED");
    expect(updated.payout).toBeNull();

    const t = await prisma.trip.findUniqueOrThrow({ where: { id: trip.id } });
    expect(t.seatsAvailable).toBe(3); // devolvidos
  });

  it("webhook com assinatura inválida é rejeitado (400) e nada muda", async () => {
    const { trip, passenger } = await createFixture();
    const { booking, providerRef } = await createPendingBooking(trip.id, passenger.id, 1);

    const res = await paymentWebhook(webhookRequest("payment.paid", providerRef, booking.id, "assinatura-falsa"));
    expect(res.status).toBe(400);

    const updated = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(updated.status).toBe("PENDING_PAYMENT");
  });

  it("webhook payment.paid é idempotente (não duplica payout)", async () => {
    const { trip, passenger } = await createFixture();
    const { booking, providerRef } = await createPendingBooking(trip.id, passenger.id, 1);

    await paymentWebhook(webhookRequest("payment.paid", providerRef, booking.id));
    await paymentWebhook(webhookRequest("payment.paid", providerRef, booking.id));

    const payouts = await prisma.payout.findMany({ where: { bookingId: booking.id } });
    expect(payouts).toHaveLength(1);
    const t = await prisma.trip.findUniqueOrThrow({ where: { id: trip.id } });
    expect(t.seatsAvailable).toBe(2); // decrementado uma única vez
  });

  it("expiração repetida devolve os assentos apenas uma vez", async () => {
    const { trip, passenger } = await createFixture();
    const { booking } = await createPendingBooking(trip.id, passenger.id, 1);

    await expireBooking(booking.id, "timeout");
    await expireBooking(booking.id, "timeout repetido");

    const updated = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    const t = await prisma.trip.findUniqueOrThrow({ where: { id: trip.id } });
    expect(updated.status).toBe("EXPIRED");
    expect(t.seatsAvailable).toBe(3);
  });

  it("pagamento recebido depois do cancelamento é reembolsado integralmente", async () => {
    const { trip, passenger } = await createFixture();
    const { booking, providerRef } = await createPendingBooking(trip.id, passenger.id, 1);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED_BY_PASSENGER", cancelledAt: new Date() },
    });

    const res = await paymentWebhook(webhookRequest("payment.paid", providerRef, booking.id));
    expect(res.status).toBe(200);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { bookingId: booking.id } });
    expect(payment.status).toBe("REFUNDED");
    expect(payment.refundCents).toBe(payment.amountCents);
  });
});
