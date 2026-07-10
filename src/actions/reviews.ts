"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionState } from "./auth";

const reviewSchema = z.object({
  bookingCode: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

/**
 * Avaliação mútua pós-viagem: o autor pode ser o passageiro (avalia o
 * motorista) ou o motorista (avalia o passageiro). Uma por reserva/direção.
 * Atualiza os agregados denormalizados do avaliado.
 */
export async function submitReviewAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse({
    bookingCode: formData.get("bookingCode"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) return { error: "Avaliação inválida." };
  const { bookingCode, rating, comment } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { code: bookingCode },
    include: { trip: true },
  });
  if (!booking) return { error: "Reserva não encontrada." };
  if (booking.status !== "COMPLETED") return { error: "A avaliação abre depois da viagem." };

  const isPassenger = booking.passengerId === user.id;
  const isDriver = booking.trip.driverId === user.id;
  if (!isPassenger && !isDriver) return { error: "Você não participa desta reserva." };

  const direction = isPassenger ? "PASSENGER_TO_DRIVER" : "DRIVER_TO_PASSENGER";
  const targetId = isPassenger ? booking.trip.driverId : booking.passengerId;

  const existing = await prisma.review.findUnique({
    where: { bookingId_authorId: { bookingId: booking.id, authorId: user.id } },
  });
  if (existing) return { error: "Você já avaliou esta viagem." };

  await prisma.review.create({
    data: {
      tripId: booking.tripId,
      bookingId: booking.id,
      authorId: user.id,
      targetId,
      direction,
      rating,
      comment,
    },
  });

  // atualiza agregados do avaliado
  const agg = await prisma.review.aggregate({
    where: { targetId, direction },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.user.update({
    where: { id: targetId },
    data:
      direction === "PASSENGER_TO_DRIVER"
        ? { driverRatingAvg: agg._avg.rating ?? 0, driverRatingCount: agg._count }
        : { passengerRatingAvg: agg._avg.rating ?? 0, passengerRatingCnt: agg._count },
  });

  revalidatePath(`/reserva/${bookingCode}`);
  return { ok: true };
}
