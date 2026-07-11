"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/session";
import { deriveTier } from "@/lib/tier";
import { getMapsProvider } from "@/providers/maps";
import { getPaymentProvider } from "@/providers/payments";
import { notify } from "@/providers/notifications";
import { PLATFORM } from "@/config/platform";
import { parseBRLToCents } from "@/lib/money";
import { formValues } from "@/lib/form-values";
import type { ActionState } from "./auth";

const publishSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo."),
  originSlug: z.string().min(1, "Informe a cidade de origem."),
  destSlug: z.string().min(1, "Informe a cidade de destino."),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  departTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido."),
  seats: z.coerce.number().int().min(1, "Ofereça ao menos 1 assento.").max(7),
  price: z.string().min(1, "Defina o preço por assento."),
  meetingPoint: z.string().trim().min(5, "Descreva o ponto de encontro."),
  dropoffPoint: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
  amenities: z.array(z.string()),
});

export async function publishTripAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user, driverProfile } = await requireDriver("/motorista/publicar");

  if (driverProfile.status !== "VERIFIED") {
    return { error: "Sua verificação de identidade ainda não foi aprovada." };
  }

  const parsed = publishSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    originSlug: formData.get("originSlug"),
    destSlug: formData.get("destSlug"),
    departDate: formData.get("departDate"),
    departTime: formData.get("departTime"),
    seats: formData.get("seats"),
    price: formData.get("price"),
    meetingPoint: formData.get("meetingPoint"),
    dropoffPoint: formData.get("dropoffPoint") || undefined,
    notes: formData.get("notes") || undefined,
    amenities: formData.getAll("amenities").map(String),
  });
  const values = formValues(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const data = parsed.data;

  if (data.originSlug === data.destSlug) return { error: "Origem e destino precisam ser diferentes.", values };

  const priceCents = parseBRLToCents(data.price);
  if (priceCents === null || priceCents < PLATFORM.minPricePerSeatCents || priceCents > PLATFORM.maxPricePerSeatCents) {
    return { error: `Preço por assento deve ficar entre R$ ${PLATFORM.minPricePerSeatCents / 100} e R$ ${PLATFORM.maxPricePerSeatCents / 100}.`, values };
  }

  const [origin, dest, vehicle] = await Promise.all([
    prisma.city.findUnique({ where: { slug: data.originSlug } }),
    prisma.city.findUnique({ where: { slug: data.destSlug } }),
    prisma.vehicle.findUnique({ where: { id: data.vehicleId } }),
  ]);
  if (!origin || !dest) return { error: "Cidade não encontrada no catálogo. Use o autocomplete.", values };
  if (!vehicle || vehicle.ownerId !== user.id) return { error: "Veículo inválido.", values };
  if (data.seats > vehicle.seats) return { error: `Este veículo comporta no máximo ${vehicle.seats} passageiros.`, values };

  const departAt = new Date(`${data.departDate}T${data.departTime}:00-03:00`);
  if (Number.isNaN(departAt.getTime()) || departAt <= new Date()) {
    return { error: "A data/hora de saída precisa estar no futuro.", values };
  }

  const route = await getMapsProvider().estimateRoute(
    { lat: origin.lat, lng: origin.lng },
    { lat: dest.lat, lng: dest.lng }
  );

  const amenityRows = await prisma.amenity.findMany({
    where: { slug: { in: data.amenities }, active: true },
  });

  const tier = deriveTier({
    amenityWeights: amenityRows.map((a) => a.tierWeight),
    vehicleYear: vehicle.year,
    vehicleCategory: vehicle.category,
  });

  const trip = await prisma.trip.create({
    data: {
      driverId: user.id,
      vehicleId: vehicle.id,
      originCity: origin.name,
      originState: origin.state,
      originLat: origin.lat,
      originLng: origin.lng,
      destCity: dest.name,
      destState: dest.state,
      destLat: dest.lat,
      destLng: dest.lng,
      departAt,
      arriveEstAt: new Date(departAt.getTime() + route.durationMin * 60_000),
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      meetingPoint: data.meetingPoint,
      dropoffPoint: data.dropoffPoint,
      notes: data.notes,
      seatsTotal: data.seats,
      seatsAvailable: data.seats,
      pricePerSeatCents: priceCents,
      tier,
      amenities: { create: amenityRows.map((a) => ({ amenityId: a.id })) },
    },
  });

  revalidatePath("/motorista");
  redirect(`/viagem/${trip.id}?publicada=1`);
}

/** Cancela a viagem: reembolsa integralmente todas as reservas pagas. */
export async function cancelTripAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user } = await requireDriver();
  const tripId = String(formData.get("tripId") ?? "");
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      bookings: {
        where: { status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
        include: { payment: true, passenger: true },
      },
    },
  });
  if (!trip || trip.driverId !== user.id) return { error: "Viagem não encontrada." };
  if (trip.status !== "PUBLISHED" && trip.status !== "FULL") {
    return { error: "Esta viagem não pode ser cancelada." };
  }

  const provider = getPaymentProvider();
  const now = new Date();

  for (const booking of trip.bookings) {
    if (booking.payment?.status === "PAID" && booking.payment.providerRef) {
      await provider.refund(booking.payment.providerRef, booking.totalCents);
    }
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED_BY_DRIVER", cancelledAt: now, cancelReason: "Viagem cancelada pelo motorista" },
      }),
      ...(booking.payment?.status === "PAID"
        ? [
            prisma.payment.update({
              where: { id: booking.payment.id },
              data: { status: "REFUNDED", refundedAt: now, refundCents: booking.totalCents },
            }),
            prisma.payout.updateMany({
              where: { bookingId: booking.id, status: "HELD" },
              data: { status: "REVERSED" },
            }),
          ]
        : []),
    ]);
    notify({
      kind: "trip.cancelled",
      to: { email: booking.passenger.email, name: booking.passenger.name },
      subject: `Viagem cancelada — ${trip.originCity} → ${trip.destCity}`,
      body: `O motorista cancelou a viagem de ${trip.departAt.toLocaleDateString("pt-BR")}. Reembolso integral de ${(booking.totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} a caminho.`,
    });
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: { status: "CANCELLED", cancelledAt: now, seatsAvailable: 0 },
  });

  revalidatePath("/motorista");
  return { ok: true };
}

/**
 * Conclui a viagem: marca reservas como COMPLETED e libera os repasses
 * (HELD → RELEASED). O acerto financeiro (RELEASED → PAID) fica a cargo
 * do provedor/rotina de payout.
 */
export async function completeTripAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user } = await requireDriver();
  const tripId = String(formData.get("tripId") ?? "");
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { bookings: { where: { status: "CONFIRMED" } } },
  });
  if (!trip || trip.driverId !== user.id) return { error: "Viagem não encontrada." };
  if (trip.status !== "PUBLISHED" && trip.status !== "FULL" && trip.status !== "IN_PROGRESS") {
    return { error: "Esta viagem não pode ser concluída." };
  }
  if (trip.departAt > new Date()) return { error: "A viagem ainda não aconteceu." };

  const now = new Date();
  await prisma.$transaction([
    prisma.trip.update({ where: { id: tripId }, data: { status: "COMPLETED" } }),
    prisma.booking.updateMany({
      where: { tripId, status: "CONFIRMED" },
      data: { status: "COMPLETED" },
    }),
    prisma.payout.updateMany({
      where: { bookingId: { in: trip.bookings.map((b) => b.id) }, status: "HELD" },
      data: { status: "RELEASED", releasedAt: now },
    }),
  ]);

  notify({
    kind: "payout.released",
    to: { email: user.email, name: user.name },
    subject: "Repasse liberado",
    body: `Viagem ${trip.originCity} → ${trip.destCity} concluída. Seu repasse foi liberado e será transferido em até 2 dias úteis.`,
  });

  revalidatePath("/motorista");
  return { ok: true };
}
