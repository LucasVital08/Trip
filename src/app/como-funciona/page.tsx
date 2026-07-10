import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { PLATFORM } from "@/config/platform";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RoadDivider } from "@/components/ui/road-divider";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Como funciona" };

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          Como o {BRAND.name}<span className="text-amber">.</span> funciona
        </h1>
        <p className="mt-3 leading-relaxed text-ink/65">
          O {BRAND.name} é um <strong>marketplace de viagens compartilhadas</strong>:
          conectamos motoristas que já vão pegar estrada a passageiros que vão na
          mesma direção. Somos a plataforma de tecnologia que intermedia — quem
          combina e realiza a viagem são vocês.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Para passageiros</h2>
          <ol className="mt-4 space-y-4">
            {[
              ["Busque a rota", "Origem, destino e data. Compare as viagens pela experiência: carro, opcionais (ar, Wi-Fi, pet…), faixa de preço e reputação do motorista."],
              ["Reserve e pague no app", "Pix ou cartão. A taxa de serviço aparece separada e o valor fica retido pela plataforma até a viagem acontecer."],
              ["Combine o embarque no chat", "Telefone só se você quiser — o chat interno resolve os combinados."],
              ["Viaje com segurança", "Compartilhe o link de acompanhamento com alguém de confiança."],
              ["Avalie (e seja avaliado)", "A avaliação mútua mantém a régua da comunidade alta."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4 rounded-2xl border border-line bg-sand-card p-4 shadow-card">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber font-bold text-ink">{i + 1}</span>
                <div>
                  <p className="font-bold">{t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink/60">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <RoadDivider subtle className="my-10" />

        <section id="motorista">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Para motoristas</h2>
          <p className="mt-3 leading-relaxed text-ink/65">
            Você define o preço por assento — <strong>livremente</strong>. A
            plataforma sugere uma faixa com base na distância e no rateio de
            custos, mas a decisão é sua: cobre perto do rateio para lotar rápido,
            ou capriche na experiência (ar, Wi-Fi, cortesias, carro novo) e cobre
            mais por ela. Viagens são etiquetadas como Econômico, Conforto ou
            Premium conforme o que você oferece.
          </p>
          <div className="mt-5 rounded-2xl bg-ink p-6 text-sand-card">
            <h3 className="flex items-center gap-2 font-bold">
              <Icon name="wallet" size={18} className="text-amber" />
              Quanto você recebe
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-sand-card/75">
              O valor que você define é 100% seu. A taxa de serviço do {BRAND.name} (
              {PLATFORM.feePercent}%) é somada ao preço pago pelo passageiro. O
              repasse é liberado quando você marca a viagem como concluída e cai em
              até 2 dias úteis.
            </p>
            <p className="mt-3 rounded-xl bg-sand-card/8 px-4 py-3 text-sm text-sand-card/85">
              Exemplo: Recife → Caruaru, 3 assentos a R$ 45. Passageiro paga
              R$ 50,40 (R$ 45 + taxa). Você recebe <strong>R$ 135</strong> pela
              viagem que já ia fazer.
            </p>
          </div>
          <Link
            href="/motorista/comecar"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-ink transition hover:bg-amber-deep"
          >
            <Icon name="car" size={16} />
            Começar a dirigir
          </Link>
        </section>

        <RoadDivider subtle className="my-10" />

        <section>
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Cancelamentos e reembolso</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink/70">
            <li className="rounded-xl bg-sand-card px-4 py-3 shadow-card">✅ <strong>Até 24h antes da saída:</strong> reembolso integral.</li>
            <li className="rounded-xl bg-sand-card px-4 py-3 shadow-card">🌗 <strong>Entre 24h e 3h antes:</strong> reembolso de 50%.</li>
            <li className="rounded-xl bg-sand-card px-4 py-3 shadow-card">⛔ <strong>Menos de 3h antes:</strong> sem reembolso (o motorista contou com você).</li>
            <li className="rounded-xl bg-sand-card px-4 py-3 shadow-card">🚗 <strong>Motorista cancelou?</strong> Reembolso integral, sempre — e a taxa de cancelamento recorrente pode suspender o perfil.</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
