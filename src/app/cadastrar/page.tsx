import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Criar conta" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <AuthCard
      title="Crie sua conta"
      subtitle="Leva um minuto. Viaje como passageiro e, quando quiser, ofereça caronas como motorista."
    >
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-ink/60">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-bold text-amber-deep hover:underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
