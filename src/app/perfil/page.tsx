import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { VerifiedBadge } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { ProfileForms } from "@/components/profile/profile-forms";

export const metadata: Metadata = { title: "Perfil e segurança" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser("/perfil");

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={user.name} src={user.avatarUrl} size={72} />
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {user.name}
              {user.identityStatus === "VERIFIED" && <VerifiedBadge />}
            </h1>
            <p className="mt-0.5 text-sm text-ink/55">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-4 text-sm">
              {user.driverRatingCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-ink/70">
                  Ao dirigir: <Stars rating={user.driverRatingAvg} count={user.driverRatingCount} />
                </span>
              )}
              {user.passengerRatingCnt > 0 && (
                <span className="inline-flex items-center gap-1.5 text-ink/70">
                  Ao viajar: <Stars rating={user.passengerRatingAvg} count={user.passengerRatingCnt} />
                </span>
              )}
            </div>
          </div>
        </div>

        {user.identityStatus !== "VERIFIED" && (
          <p className="mt-6 flex items-start gap-3 rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3.5 text-sm leading-relaxed text-ink/75">
            <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-amber-deep" />
            <span>
              <strong>Identidade não verificada.</strong> A verificação (documento +
              selfie) pertence à sua conta única. Ela é obrigatória para publicar
              viagens e aumenta a confiança quando você reserva um lugar.
            </span>
          </p>
        )}

        <ProfileForms
          bio={user.bio ?? ""}
          safetyContactName={user.safetyContactName ?? ""}
          safetyContactPhone={user.safetyContactPhone ?? ""}
        />
      </main>
      <Footer />
    </div>
  );
}
