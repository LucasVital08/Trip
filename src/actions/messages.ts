"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { notify } from "@/providers/notifications";
import type { ActionState } from "./auth";

/**
 * Chat interno por viagem (passageiro ↔ motorista) — o telefone pessoal
 * não é exposto antes da reserva.
 */
export async function startConversationAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const tripId = String(formData.get("tripId") ?? "");
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) redirect("/buscar");
  if (trip.driverId === user.id) redirect(`/motorista/viagens/${tripId}`);

  const convo = await prisma.conversation.upsert({
    where: { tripId_passengerId: { tripId, passengerId: user.id } },
    create: { tripId, passengerId: user.id, driverId: trip.driverId },
    update: {},
  });
  redirect(`/mensagens/${convo.id}`);
}

export async function sendMessageAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!body) return { error: "Escreva uma mensagem." };

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { passenger: true, driver: true, trip: true },
  });
  if (!convo || (convo.passengerId !== user.id && convo.driverId !== user.id)) {
    return { error: "Conversa não encontrada." };
  }

  await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId: user.id, body } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ]);

  const recipient = convo.passengerId === user.id ? convo.driver : convo.passenger;
  notify({
    kind: "message.received",
    to: { email: recipient.email, name: recipient.name },
    subject: `Nova mensagem de ${user.name}`,
    body: `Sobre a viagem ${convo.trip.originCity} → ${convo.trip.destCity}: "${body.slice(0, 120)}"`,
  });

  revalidatePath(`/mensagens/${conversationId}`);
  return { ok: true };
}

export async function markConversationReadAction(conversationId: string): Promise<void> {
  const user = await requireUser();
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });
}
