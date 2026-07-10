import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/session";
import { PLATFORM } from "@/config/platform";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PublishTripForm } from "@/components/driver/publish-trip-form";

export const metadata: Metadata = { title: "Publicar viagem" };
export const dynamic = "force-dynamic";

export default async function PublishTripPage() {
  const { user, driverProfile } = await requireDriver("/motorista/publicar");
  if (driverProfile.status !== "VERIFIED") redirect("/motorista/comecar");

  const [vehicles, amenities] = await Promise.all([
    prisma.vehicle.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.amenity.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (vehicles.length === 0) redirect("/motorista/veiculos?novo=1");

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Publicar viagem
        </h1>
        <p className="mt-1 text-ink/60">
          Os opcionais que você marcar definem a faixa da viagem e viram filtros
          para os passageiros — capriche na experiência.
        </p>

        <PublishTripForm
          vehicles={vehicles.map((v) => ({
            id: v.id,
            label: `${v.brand} ${v.model} ${v.year} · ${v.color}`,
            seats: v.seats,
            year: v.year,
            category: v.category,
          }))}
          amenities={amenities.map((a) => ({
            slug: a.slug,
            label: a.label,
            icon: a.icon,
            description: a.description,
            tierWeight: a.tierWeight,
          }))}
          feePercent={PLATFORM.feePercent}
        />
      </main>
      <Footer />
    </div>
  );
}
