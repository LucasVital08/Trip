import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { hasGoogleOAuth } from "@/lib/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const { callbackUrl } = await searchParams;

  return (
    <AuthCard
      title="Bem-vindo de volta"
      subtitle="Entre para reservar seu lugar ou publicar sua próxima viagem."
    >
      <LoginForm callbackUrl={callbackUrl} showGoogle={hasGoogleOAuth()} />
      <p className="mt-6 text-center text-sm text-ink/60">
        Primeira vez por aqui?{" "}
        <Link href="/cadastrar" className="font-bold text-amber-deep hover:underline">
          Criar conta
        </Link>
      </p>
      <p className="mt-4 rounded-xl bg-sand px-3.5 py-2.5 text-center text-xs text-ink/55">
        <strong>Demo:</strong> passageiro@trip.dev ou motorista@trip.dev · senha{" "}
        <code className="font-mono font-bold">trip123</code>
      </p>
    </AuthCard>
  );
}
