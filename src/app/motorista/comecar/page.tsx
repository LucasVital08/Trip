import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Icon } from "@/components/ui/icon";
import { RoadDivider } from "@/components/ui/road-divider";
import { BecomeDriverForm } from "@/components/driver/become-driver-form";

export const metadata: Metadata = { title: "Oferecer carona" };
export const dynamic = "force-dynamic";

export default async function BecomeDriverPage() {
  const user = await requireUser("/motorista/comecar");
  if (user.driverProfile?.status === "VERIFIED") redirect("/motorista");

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Ative a publicação de viagens na sua conta
        </h1>
        <p className="mt-2 max-w-xl leading-relaxed text-ink/60">
          Não existe conta separada de motorista: a mesma conta que você usa para
          reservar também publica viagens. Para oferecer lugares no seu carro,
          precisamos apenas verificar sua identidade e sua CNH.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["shield", "Identidade verificada", "Documento + selfie, obrigatório para dirigir"],
            ["wallet", "Você define o preço", "A plataforma sugere, você decide"],
            ["clock", "Repasse pós-viagem", "Pagamento retido e repassado após concluir"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="rounded-2xl border border-line bg-sand-card p-4 shadow-card">
              <Icon name={icon} size={18} className="text-amber-deep" />
              <p className="mt-2 text-sm font-bold">{title}</p>
              <p className="mt-0.5 text-xs text-ink/55">{desc}</p>
            </div>
          ))}
        </div>

        <RoadDivider subtle className="my-8" />

        {user.driverProfile && (
          <p className="mb-6 rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm font-semibold text-ink/75">
            Sua verificação anterior está com status{" "}
            {user.driverProfile.status === "PENDING" ? "em análise" : "recusada"}.
            Reenvie os dados abaixo para tentar novamente.
          </p>
        )}

        <BecomeDriverForm defaultName={user.name} defaultPhone={user.phone ?? ""} />
      </main>
      <Footer />
    </div>
  );
}
