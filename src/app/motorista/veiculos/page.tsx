import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/session";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Icon } from "@/components/ui/icon";
import { AddVehicleForm } from "@/components/driver/add-vehicle-form";

export const metadata: Metadata = { title: "Meus veículos" };
export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  HATCH: "Hatch",
  SEDAN: "Sedã",
  SUV: "SUV",
  MINIVAN: "Minivan",
  PICKUP: "Picape",
};

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const { user } = await requireDriver("/motorista/veiculos");
  const { novo } = await searchParams;
  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Meus veículos
        </h1>
        <p className="mt-1 text-ink/60">
          O carro faz parte da experiência: ano e categoria entram no cálculo da
          faixa (Econômico / Conforto / Premium).
        </p>

        {novo && vehicles.length === 0 && (
          <p className="mt-6 rounded-2xl border border-trust/25 bg-trust/8 px-4 py-3 text-sm font-semibold text-trust">
            ✓ Verificação aprovada! Agora cadastre seu carro para publicar a primeira viagem.
          </p>
        )}

        <div className="mt-6 space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center gap-4 rounded-2xl border border-line bg-sand-card p-5 shadow-card">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/15 text-amber-deep">
                <Icon name="car" size={24} />
              </span>
              <div className="flex-1">
                <p className="font-bold">
                  {v.brand} {v.model} {v.year}
                </p>
                <p className="text-sm text-ink/55">
                  {CATEGORY_LABEL[v.category]} · {v.color} · placa {v.plate} · {v.seats} lugares p/ passageiros
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <AddVehicleForm firstVehicle={vehicles.length === 0} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
