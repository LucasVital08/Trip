"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { computeBookingPrice, computeRefundCents } from "@/lib/pricing";
import { confirmBooking, expireBooking } from "@/lib/booking-service";
import { generateBookingCode, generateShareToken } from "@/lib/booking-code";
import { getPaymentProvider } from "@/providers/payments";
import { PLATFORM } from "@/config/platform";
import type { ActionState } from "./auth";

const createBookingSchema = z.object({
  tripId: z.string().min(1),
  seats: z.coerce.number().int().min(1).max(PLATFORM.maxSeatsPerBooking),
  method: z.enum(["PIX", "CARD"]),
  cardToken: z.string().optional(),
});

/**
 * Reserva + cobrança, em transação:
 *  1. decrementa assentos com verificação atômica (sem overbooking);
 *  2. cria Booking com fotografia de preços (subtotal + taxa Trip);
 *  3. cria a cobrança no provedor (Pix fica pendente; cartão aprova/na hora);
 *  4. cria o Payout em HELD (escrow) quando pago.
 */
export async function createBookingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createBookingSchema.safeParse({
    tripId: formData.get("tripId"),
    seats: formData.get("seats"),
    method: formData.get("method"),
    cardToken: formData.get("cardToken") || undefined,
  });
  if (!parsed.success) return { error: "Dados da reserva inválidos." };
  const { tripId, seats, method, cardToken } = parsed.data;

  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { driver: true } });
  if (!trip || trip.status !== "PUBLISHED") return { error: "Esta viagem não está mais disponível." };
  if (trip.departAt <= new Date()) return { error: "Esta viagem já partiu." };
  if (trip.driverId === user.id) return { error: "Você não pode reservar a própria viagem." };
  if (trip.seatsAvailable < seats) return { error: "Não há assentos suficientes disponíveis." };

  const existing = await prisma.booking.findFirst({
    where: { tripId, passengerId: user.id, status: { in: ["PENDING_PAYMENT", "CONFIRMED"] } },
  });
  if (existing) redirect(`/reserva/${existing.code}`);

  const price = computeBookingPrice(trip.pricePerSeatCents, seats);

  // 1–2: reserva de assentos atômica
  let bookingCode: string;
  try {
    bookingCode = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.updateMany({
        where: { id: tripId, seatsAvailable: { gte: seats }, status: "PUBLISHED" },
        data: { seatsAvailable: { decrement: seats } },
      });
      if (updated.count === 0) throw new Error("SEATS_TAKEN");
      const booking = await tx.booking.create({
        data: {
          code: generateBookingCode(),
          tripId,
          passengerId: user.id,
          seats,
          status: "PENDING_PAYMENT",
          pricePerSeatCents: price.pricePerSeatCents,
          subtotalCents: price.subtotalCents,
          serviceFeeCents: price.serviceFeeCents,
          totalCents: price.totalCents,
          shareToken: generateShareToken(),
          shareExpiresAt: new Date(trip.arriveEstAt.getTime() + 24 * 60 * 60_000),
          paymentExpiresAt: new Date(Date.now() + PLATFORM.paymentExpiresMinutes * 60_000),
          activeKey: `${user.id}:${tripId}`,
        },
      });
      return booking.code;
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SEATS_TAKEN") {
      return { error: "Ops — outro passageiro acabou de reservar. Assentos insuficientes." };
    }
    if (typeof e === "object" && e && "code" in e && e.code === "P2002") {
      const concurrent = await prisma.booking.findFirst({
        where: { tripId, passengerId: user.id, status: { in: ["PENDING_PAYMENT", "CONFIRMED"] } },
      });
      if (concurrent) redirect(`/reserva/${concurrent.code}`);
    }
    throw e;
  }

  const booking = await prisma.booking.findUniqueOrThrow({ where: { code: bookingCode } });

  // 3: cobrança
  const provider = getPaymentProvider();
  let charge;
  try {
    charge = await provider.createCharge({
    bookingId: booking.id,
    bookingCode: booking.code,
    method,
    amountCents: price.totalCents,
    serviceFeeCents: price.serviceFeeCents,
    driverAmountCents: price.driverAmountCents,
    customer: { id: user.id, name: user.name, email: user.email },
    cardToken,
    });
  } catch (error) {
    await expireBooking(booking.id, "Não foi possível iniciar o pagamento");
    console.error("[booking] falha ao criar cobrança", error);
    return { error: "Não foi possível iniciar o pagamento. Seus assentos foram liberados; tente novamente." };
  }

  try {
    await prisma.payment.create({
      data: {
      bookingId: booking.id,
      provider: provider.name,
      providerRef: charge.providerRef,
      method,
      status: charge.status === "paid" ? "PAID" : charge.status === "failed" ? "FAILED" : "PENDING",
      amountCents: price.totalCents,
      serviceFeeCents: price.serviceFeeCents,
      driverAmountCents: price.driverAmountCents,
      pixQrCode: charge.pixQrCode,
      cardLast4: charge.cardLast4,
      paidAt: charge.status === "paid" ? new Date() : null,
      failReason: charge.failReason,
      },
    });
  } catch (error) {
    try {
      if (charge.status === "paid") {
        await provider.refund(charge.providerRef, price.totalCents);
      } else {
        await provider.cancelCharge(charge.providerRef);
      }
    } catch (compensationError) {
      console.error("[booking] falha ao compensar cobrança órfã", compensationError);
    }
    await expireBooking(booking.id, "Falha ao registrar pagamento");
    console.error("[booking] falha ao persistir cobrança", error);
    return { error: "Não foi possível registrar o pagamento. Seus assentos foram liberados." };
  }

  if (charge.status === "paid") {
    await confirmBooking(booking.id);
  } else if (charge.status === "failed") {
    await expireBooking(booking.id, "Pagamento recusado");
    return { error: charge.failReason ?? "Pagamento recusado. Tente outro cartão." };
  }

  revalidatePath("/minhas-viagens");
  redirect(`/reserva/${booking.code}`);
}

/**
 * Cancelamento pelo passageiro com política de reembolso por antecedência
 * (≥24h: 100%; 3–24h: 50%; <3h: 0). Devolve assentos e reverte o payout.
 */
export async function cancelBookingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const code = String(formData.get("code") ?? "");
  const booking = await prisma.booking.findUnique({
    where: { code },
    include: { trip: true, payment: true },
  });
  if (!booking || booking.passengerId !== user.id) return { error: "Reserva não encontrada." };
  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING_PAYMENT") {
    return { error: "Esta reserva não pode mais ser cancelada." };
  }

  const now = new Date();
  if (booking.trip.departAt <= now) return { error: "Não é possível cancelar depois da saída." };
  const cancelled = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${booking.id} FOR UPDATE`;
    const current = await tx.booking.findUnique({
      where: { id: booking.id },
      include: { payment: true, trip: true },
    });
    if (!current || !["CONFIRMED", "PENDING_PAYMENT"].includes(current.status)) return false;
    const refundCents = current.payment?.status === "PAID"
      ? computeRefundCents(current.totalCents, current.trip.departAt, now)
      : 0;
    if (current.payment?.status === "PAID" && refundCents > 0 && current.payment.providerRef) {
      await getPaymentProvider().refund(current.payment.providerRef, refundCents);
    }
    const changed = await tx.booking.updateMany({
      where: { id: current.id, status: current.status },
      data: {
        status: "CANCELLED_BY_PASSENGER",
        cancelledAt: now,
        cancelReason: "Cancelado pelo passageiro",
        activeKey: null,
        shareRevokedAt: now,
      },
    });
    if (changed.count === 0) return false;
    await tx.trip.update({
      where: { id: booking.tripId },
      data: { seatsAvailable: { increment: booking.seats } },
    });
    if (current.payment?.status === "PAID") {
      if (refundCents > 0) {
        await tx.payment.update({
            where: { id: current.payment.id },
            data: {
              status: refundCents >= current.totalCents ? "REFUNDED" : "PARTIALLY_REFUNDED",
              refundedAt: now,
              refundCents,
            },
        });
      }
      if (refundCents >= current.totalCents) {
        await tx.payout.updateMany({
          where: { bookingId: booking.id, status: "HELD" },
          data: { status: "REVERSED" },
        });
      } else {
        const retainedRatio = (current.totalCents - refundCents) / current.totalCents;
        await tx.payout.updateMany({
          where: { bookingId: booking.id, status: "HELD" },
          data: { amountCents: Math.round(current.subtotalCents * retainedRatio) },
        });
      }
    }
    return true;
  });
  if (!cancelled) return { error: "A reserva mudou enquanto era cancelada. Atualize a página." };

  revalidatePath(`/reserva/${code}`);
  revalidatePath("/minhas-viagens");
  return { ok: true };
}

/**
 * DEV ONLY (provedor mock): simula a confirmação assíncrona do Pix chamando
 * o webhook interno — o mesmo caminho que um provedor real usaria.
 */
export async function simulatePixPaymentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const code = String(formData.get("code") ?? "");
  const booking = await prisma.booking.findUnique({
    where: { code },
    include: { payment: true },
  });
  if (!booking || booking.passengerId !== user.id || !booking.payment) {
    return { error: "Reserva não encontrada." };
  }
  if (booking.payment.provider !== "mock") {
    return { error: "Simulação disponível apenas com o provedor mock." };
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await fetch(`${base}/api/webhooks/payment`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-webhook-signature": "mock-signature" },
    body: JSON.stringify({
      type: "payment.paid",
      providerRef: booking.payment.providerRef,
      bookingId: booking.id,
    }),
  });

  revalidatePath(`/reserva/${code}`);
  return { ok: true };
}
