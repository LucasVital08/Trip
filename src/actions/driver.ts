"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { VehicleCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, requireDriver } from "@/lib/session";
import { getKycProvider } from "@/providers/kyc";
import { formValues } from "@/lib/form-values";
import { notify } from "@/providers/notifications";
import type { ActionState } from "./auth";

const becomeDriverSchema = z.object({
  fullName: z.string().trim().min(5, "Informe o nome completo como está no documento."),
  cpf: z.string().trim().min(11, "CPF inválido."),
  cnhNumber: z.string().trim().min(9, "Número da CNH inválido."),
  cnhCategory: z.enum(["A", "B", "AB", "C", "D", "E"]),
  cnhExpiresAt: z.coerce.date().refine((d) => d > new Date(), "CNH vencida."),
  phone: z.string().trim().min(10, "Informe um telefone com DDD."),
});

/**
 * Onboarding de motorista: dados de CNH + verificação de identidade (KYC).
 * Com o provedor mock, CPF válido → aprovação imediata (dev).
 */
export async function becomeDriverAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser("/motorista/comecar");
  const parsed = becomeDriverSchema.safeParse({
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    cnhNumber: formData.get("cnhNumber"),
    cnhCategory: formData.get("cnhCategory"),
    cnhExpiresAt: formData.get("cnhExpiresAt"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, values: formValues(formData) };
  }
  const data = parsed.data;

  const kyc = await getKycProvider().submit({
    userId: user.id,
    fullName: data.fullName,
    documentNumber: data.cpf,
  });

  await prisma.$transaction([
    prisma.identityVerification.create({
      data: {
        userId: user.id,
        provider: getKycProvider().name,
        providerRef: kyc.providerRef,
        status: kyc.status,
        notes: kyc.notes,
        reviewedAt: kyc.status !== "PENDING" ? new Date() : null,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { identityStatus: kyc.status, phone: data.phone },
    }),
    prisma.driverProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        cnhNumber: data.cnhNumber,
        cnhCategory: data.cnhCategory,
        cnhExpiresAt: data.cnhExpiresAt,
        status: kyc.status,
      },
      update: {
        cnhNumber: data.cnhNumber,
        cnhCategory: data.cnhCategory,
        cnhExpiresAt: data.cnhExpiresAt,
        status: kyc.status,
      },
    }),
  ]);

  if (kyc.status === "REJECTED") {
    return {
      error: `Verificação recusada: ${kyc.notes ?? "dados inconsistentes."} Revise e tente novamente.`,
      values: formValues(formData),
    };
  }

  notify({
    kind: "kyc.updated",
    to: { email: user.email, name: user.name },
    subject: "Verificação de identidade aprovada",
    body: "Seu perfil de motorista está verificado. Cadastre seu veículo e publique sua primeira viagem!",
  });

  redirect("/motorista/veiculos?novo=1");
}

const vehicleSchema = z.object({
  brand: z.string().trim().min(2, "Informe a marca."),
  model: z.string().trim().min(1, "Informe o modelo."),
  year: z.coerce.number().int().min(1990, "Ano inválido.").max(new Date().getFullYear() + 1, "Ano inválido."),
  color: z.string().trim().min(3, "Informe a cor."),
  plate: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/, "Placa inválida (padrão Mercosul ou antigo)."),
  category: z.enum(VehicleCategory),
  seats: z.coerce.number().int().min(1).max(7),
});

export async function addVehicleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user } = await requireDriver("/motorista/veiculos");
  const parsed = vehicleSchema.safeParse({
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year"),
    color: formData.get("color"),
    plate: formData.get("plate"),
    category: formData.get("category"),
    seats: formData.get("seats"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, values: formValues(formData) };
  }

  await prisma.vehicle.create({
    data: { ...parsed.data, plate: parsed.data.plate.replace("-", ""), ownerId: user.id, photos: [] },
  });

  revalidatePath("/motorista/veiculos");
  return { ok: true };
}

export async function updateDriverBioAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 500);
  await prisma.user.update({ where: { id: user.id }, data: { bio } });
  revalidatePath("/perfil");
  return { ok: true };
}
