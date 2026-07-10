"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionState } from "./auth";

const reportSchema = z.object({
  targetUserId: z.string().min(1),
  tripId: z.string().optional(),
  reason: z.enum([
    "conduta_perigosa",
    "assedio",
    "veiculo_diferente",
    "cobranca_indevida",
    "perfil_falso",
    "outro",
  ]),
  details: z.string().trim().max(2000).optional(),
});

export async function reportUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    tripId: formData.get("tripId") || undefined,
    reason: formData.get("reason"),
    details: formData.get("details") || undefined,
  });
  if (!parsed.success) return { error: "Preencha o motivo da denúncia." };
  if (parsed.data.targetUserId === user.id) return { error: "Denúncia inválida." };

  await prisma.report.create({
    data: {
      reporterId: user.id,
      targetUserId: parsed.data.targetUserId,
      tripId: parsed.data.tripId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });
  return { ok: true };
}

const safetyContactSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do contato."),
  phone: z.string().trim().min(10, "Informe um telefone com DDD."),
});

export async function saveSafetyContactAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = safetyContactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.user.update({
    where: { id: user.id },
    data: { safetyContactName: parsed.data.name, safetyContactPhone: parsed.data.phone },
  });
  revalidatePath("/perfil");
  return { ok: true };
}
