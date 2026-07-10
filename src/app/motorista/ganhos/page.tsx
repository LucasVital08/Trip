import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/session";
import { formatBRL } from "@/lib/money";
import { formatDateShort } from "@/lib/dates";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Ganhos e repasses" };
export const dynamic = "force-dynamic";

const PAYOUT_LABEL: Record<string, { label: string; cls: string }> = {
  HELD: { label: "Em custódia", cls: "bg-amber/20 text-amber-deep" },
  RELEASED: { label: "Liberado", cls: "bg-trust/12 text-trust" },
  PAID: { label: "Transferido", cls: "bg-ink/8 text-ink/60" },
  REVERSED: { label: "Estornado", cls: "bg-red-100 text-red-900" },
};

export default async function EarningsPage() {
  const { user } = await requireDriver("/motorista/ganhos");

  const payouts = await prisma.payout.findMany({
    where: { driverId: user.id },
    include: {
      booking: {
        include: {
          trip: { select: { originCity: true, destCity: true, departAt: true } },
          passenger: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const sum = (statuses: string[]) =>
    payouts.filter((p) => statuses.includes(p.status)).reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Ganhos e repasses
        </h1>
        <p className="mt-1 max-w-xl text-ink/60">
          O pagamento do passageiro fica retido pela plataforma e é liberado
          quando você marca a viagem como concluída. A transferência acontece em
          até 2 dias úteis após a liberação.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Em custódia" value={formatBRL(sum(["HELD"]))} icon="clock" />
          <Metric label="Liberado (a transferir)" value={formatBRL(sum(["RELEASED"]))} icon="wallet" />
          <Metric label="Já transferido" value={formatBRL(sum(["PAID"]))} icon="check" />
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Extrato</h2>
          {payouts.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-line bg-sand-card px-5 py-8 text-center text-sm text-ink/55">
              Nenhum repasse ainda — publique uma viagem e receba por assento reservado.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-sand-card shadow-card">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs font-bold uppercase tracking-wider text-ink/45">
                    <th className="px-5 py-3.5">Viagem</th>
                    <th className="px-5 py-3.5">Passageiro</th>
                    <th className="px-5 py-3.5">Data</th>
                    <th className="px-5 py-3.5 text-right">Valor</th>
                    <th className="px-5 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => {
                    const chip = PAYOUT_LABEL[p.status];
                    return (
                      <tr key={p.id} className="border-b border-line/60 last:border-0">
                        <td className="px-5 py-3.5 font-semibold">
                          {p.booking.trip.originCity} → {p.booking.trip.destCity}
                        </td>
                        <td className="px-5 py-3.5 text-ink/65">{p.booking.passenger.name}</td>
                        <td className="px-5 py-3.5 text-ink/65">{formatDateShort(p.booking.trip.departAt)}</td>
                        <td className="px-5 py-3.5 text-right font-bold tabular-nums">{formatBRL(p.amountCents)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${chip.cls}`}>{chip.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-3xl border border-line bg-sand-card p-5 shadow-card">
      <Icon name={icon} size={20} className="text-amber-deep" />
      <p className="mt-2 text-xl font-extrabold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-ink/45">{label}</p>
    </div>
  );
}
