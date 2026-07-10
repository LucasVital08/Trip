"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function toggleFavoriteAction(tripId: string): Promise<{ favorited: boolean } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthenticated" };

  const existing = await prisma.favorite.findUnique({
    where: { userId_tripId: { userId: user.id, tripId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { userId_tripId: { userId: user.id, tripId } } });
    revalidatePath("/favoritos");
    return { favorited: false };
  }
  await prisma.favorite.create({ data: { userId: user.id, tripId } });
  revalidatePath("/favoritos");
  return { favorited: true };
}
