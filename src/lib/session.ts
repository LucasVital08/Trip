import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Usuário completo da sessão atual (ou null). Cacheado por request. */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findFirst({
    where: { id: session.user.id, blockedAt: null },
    include: { driverProfile: true },
  });
});

/** Exige login; redireciona para /entrar preservando o destino. */
export async function requireUser(callbackPath?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const cb = callbackPath ? `?callbackUrl=${encodeURIComponent(callbackPath)}` : "";
    redirect(`/entrar${cb}`);
  }
  return user;
}

/** Exige que a conta única tenha habilitado a capacidade de publicar viagens. */
export async function requireDriver(callbackPath?: string) {
  const user = await requireUser(callbackPath);
  if (!user.driverProfile) redirect("/motorista/comecar");
  return { user, driverProfile: user.driverProfile };
}
