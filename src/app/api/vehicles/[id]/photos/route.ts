import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getMediaProvider, type StoredMedia } from "@/providers/media";
import { MAX_VEHICLE_PHOTOS, validateVehiclePhoto } from "@/lib/vehicle-photo";

export const runtime = "nodejs";

async function ownedVehicle(vehicleId: string, userId: string) {
  return prisma.vehicle.findFirst({
    where: { id: vehicleId, ownerId: userId },
    include: { photos: { orderBy: { position: "asc" } } },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para enviar fotos." }, { status: 401 });
  if (!checkRateLimit(`vehicle-photo:${user.id}`, 16, 60 * 60_000)) {
    return NextResponse.json({ error: "Muitos uploads. Aguarde antes de tentar novamente." }, { status: 429 });
  }

  const { id } = await params;
  const vehicle = await ownedVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "Veículo não encontrado." }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("photos").filter((item): item is File => item instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "Selecione ao menos uma foto." }, { status: 400 });
  if (vehicle.photos.length + files.length > MAX_VEHICLE_PHOTOS) {
    return NextResponse.json({ error: `O veículo pode ter até ${MAX_VEHICLE_PHOTOS} fotos.` }, { status: 400 });
  }

  const prepared: Array<{ data: Buffer; contentType: string; extension: string }> = [];
  for (const file of files) {
    const data = Buffer.from(await file.arrayBuffer());
    const validation = validateVehiclePhoto(data, file.type);
    if ("error" in validation) return NextResponse.json({ error: validation.error }, { status: 400 });
    prepared.push({ data, contentType: file.type, extension: validation.extension });
  }

  const provider = getMediaProvider();
  const stored: StoredMedia[] = [];
  try {
    for (const photo of prepared) stored.push(await provider.storeVehiclePhoto(photo));
    const created = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${vehicle.id} FOR UPDATE`;
      const count = await tx.vehiclePhoto.count({ where: { vehicleId: vehicle.id } });
      if (count + stored.length > MAX_VEHICLE_PHOTOS) throw new Error("PHOTO_LIMIT");
      return Promise.all(stored.map((photo, index) => tx.vehiclePhoto.create({
        data: {
          vehicleId: vehicle.id,
          url: photo.url,
          provider: photo.provider,
          storageKey: photo.storageKey,
          position: count + index,
        },
      })));
    });
    revalidateVehiclePaths();
    return NextResponse.json({ photos: created }, { status: 201 });
  } catch (error) {
    await Promise.allSettled(stored.map((photo) => provider.delete(photo.storageKey)));
    if (error instanceof Error && error.message === "PHOTO_LIMIT") {
      return NextResponse.json({ error: `O veículo pode ter até ${MAX_VEHICLE_PHOTOS} fotos.` }, { status: 409 });
    }
    console.error("[vehicle-photo] upload falhou", error);
    return NextResponse.json({ error: "Não foi possível salvar as fotos." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { id } = await params;
  const { photoId } = await req.json() as { photoId?: string };
  if (!photoId) return NextResponse.json({ error: "Foto inválida." }, { status: 400 });

  const photo = await prisma.vehiclePhoto.findFirst({
    where: { id: photoId, vehicle: { id, ownerId: user.id } },
  });
  if (!photo) return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });

  await prisma.vehiclePhoto.delete({ where: { id: photo.id } });
  try {
    if (photo.provider !== "legacy") await getMediaProvider().delete(photo.storageKey);
  } catch (error) {
    console.error("[vehicle-photo] mídia órfã após exclusão", error);
  }
  await normalizePositions(id);
  revalidateVehiclePaths();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { id } = await params;
  const { photoId } = await req.json() as { photoId?: string };
  const photos = await prisma.vehiclePhoto.findMany({
    where: { vehicleId: id, vehicle: { ownerId: user.id } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  if (!photoId || !photos.some((photo) => photo.id === photoId)) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }
  const ordered = [photos.find((photo) => photo.id === photoId)!, ...photos.filter((photo) => photo.id !== photoId)];
  await prisma.$transaction(ordered.map((photo, position) => prisma.vehiclePhoto.update({
    where: { id: photo.id },
    data: { position },
  })));
  revalidateVehiclePaths();
  return NextResponse.json({ ok: true });
}

async function normalizePositions(vehicleId: string) {
  const photos = await prisma.vehiclePhoto.findMany({
    where: { vehicleId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  await prisma.$transaction(photos.map((photo, position) => prisma.vehiclePhoto.update({
    where: { id: photo.id },
    data: { position },
  })));
}

function revalidateVehiclePaths() {
  revalidatePath("/motorista/veiculos");
  revalidatePath("/buscar");
  revalidatePath("/viagem/[id]", "page");
}
