import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BRAND } from "@/config/brand";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchForm } from "@/components/search/search-form";
import { TripCard } from "@/components/trip/trip-card";
import { RoadDivider } from "@/components/ui/road-divider";
import { Icon } from "@/components/ui/icon";
import { searchTrips } from "@/lib/search";
import { tomorrowInputValue } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [routesRaw, featured] = await Promise.all([
    prisma.trip.groupBy({
      by: ["originCity", "destCity"],
      where: { status: "PUBLISHED", departAt: { gt: new Date() }, seatsAvailable: { gt: 0 } },
      _count: true,
      _min: { pricePerSeatCents: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    searchTrips({}).then((t) => t.slice(0, 3)),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header dark />

      {/* ─── Hero ─── */}
      <section className="relative bg-ink text-sand-card">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber">
              <Icon name="route" size={14} />
              Pelo Brasil, de cidade em cidade
            </p>
            <h1
              className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              A estrada é melhor
              <br />
              <span className="text-amber">acompanhada.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-sand-card/70">
              Motoristas que já vão viajar oferecem os lugares livres do carro.
              Você escolhe pela <strong className="text-sand-card">experiência</strong> — o
              carro, o clima a bordo, a reputação — não só pelo preço.
            </p>
          </div>

          {/* cartão de busca */}
          <div className="mt-10 rounded-3xl bg-sand-card p-5 text-ink shadow-card-hover sm:p-6">
            <SearchForm />
          </div>
        </div>
        <RoadDivider />
      </section>

      {/* ─── Rotas populares ─── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          Rotas com viagens abertas
        </h2>
        <p className="mt-1 text-ink/60">Atalhos para as rotas mais movimentadas da semana.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routesRaw.map((r) => (
            <Link
              key={`${r.originCity}-${r.destCity}`}
              href={`/buscar?origemNome=${encodeURIComponent(r.originCity)}&destinoNome=${encodeURIComponent(r.destCity)}`}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-sand-card px-5 py-4 shadow-card transition hover:shadow-card-hover"
            >
              <div>
                <p className="font-bold">
                  {r.originCity}
                  <span className="mx-2 text-amber-deep" aria-hidden="true">→</span>
                  {r.destCity}
                </p>
                <p className="mt-0.5 text-sm text-ink/55">
                  {r._count} {r._count === 1 ? "viagem" : "viagens"} · a partir de{" "}
                  {((r._min.pricePerSeatCents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                </p>
              </div>
              <Icon name="arrow-right" size={18} className="text-ink/30 transition group-hover:translate-x-1 group-hover:text-amber-deep" />
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Em destaque ─── */}
      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                Saindo em breve
              </h2>
              <p className="mt-1 text-ink/60">Motoristas bem avaliados com lugares livres.</p>
            </div>
            <Link href={`/buscar?data=${tomorrowInputValue()}`} className="hidden items-center gap-1.5 text-sm font-bold text-amber-deep hover:underline sm:inline-flex">
              Ver todas <Icon name="arrow-right" size={15} />
            </Link>
          </div>
          <div className="grid gap-4">
            {featured.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Como funciona ─── */}
      <section className="bg-ink-2 text-sand-card">
        <RoadDivider subtle />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            Como o {BRAND.name}
            <span className="text-amber">.</span> funciona
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <Step
              n={1}
              icon="search"
              title="Busque a rota"
              text="Origem, destino e data. Compare preço, carro, opcionais e a reputação de cada motorista."
            />
            <Step
              n={2}
              icon="wallet"
              title="Reserve e pague no app"
              text="Pix ou cartão, com a taxa de serviço transparente. O valor fica retido e só é repassado ao motorista depois da viagem."
            />
            <Step
              n={3}
              icon="star"
              title="Viaje e avalie"
              text="Compartilhe a viagem em tempo real com quem você confia. Depois, motorista e passageiro se avaliam mutuamente."
            />
          </div>
        </div>
        <RoadDivider subtle />
      </section>

      {/* ─── Faixas de experiência ─── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          Do econômico ao premium — você escolhe
        </h2>
        <p className="mt-2 max-w-2xl text-ink/60">
          Um Uno a preço de rateio e um SUV com Wi-Fi e água gelada convivem na mesma
          busca. Bolsos e desejos diferentes, a mesma estrada.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <TierCard
            name="Econômico"
            desc="O básico bem feito: chegar ao destino pagando pouco, com segurança e avaliação real."
            items={["Preço próximo do rateio", "Motorista verificado", "Avaliações públicas"]}
          />
          <TierCard
            name="Conforto"
            highlight
            desc="Ar-condicionado, carro mais novo, cortesias. A viagem confortável para o dia a dia."
            items={["Ar-condicionado", "Carro novo", "Água & bala, USB"]}
          />
          <TierCard
            name="Premium"
            desc="O pacote completo: SUV ou sedã premium, Wi-Fi, paradas planejadas — experiência de turismo."
            items={["Carro premium", "Wi-Fi a bordo", "Experiência completa"]}
          />
        </div>
      </section>

      {/* ─── Segurança ─── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-8 rounded-3xl bg-ink p-8 text-sand-card sm:grid-cols-2 sm:p-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-trust/40 bg-trust/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#7fc9a8]">
              <Icon name="shield" size={14} />
              Segurança em primeiro lugar
            </p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              Viajar com estranhos, sem sustos
            </h2>
            <p className="mt-3 leading-relaxed text-sand-card/70">
              Todo motorista passa por verificação de identidade com documento e
              selfie antes de publicar uma viagem. E você viaja com ferramentas de
              segurança na mão.
            </p>
            <Link
              href="/seguranca"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-amber-deep"
            >
              Conheça as ferramentas <Icon name="arrow-right" size={15} />
            </Link>
          </div>
          <ul className="grid content-center gap-3 text-sm">
            {[
              ["shield", "Verificação de identidade obrigatória para motoristas"],
              ["share", "Compartilhamento da viagem em tempo real com um contato de confiança"],
              ["message", "Chat interno — seu telefone não é exposto antes da reserva"],
              ["alert", "Botão de emergência durante a viagem e canal de denúncia"],
            ].map(([icon, text]) => (
              <li key={icon} className="flex items-start gap-3 rounded-2xl bg-sand-card/5 px-4 py-3">
                <Icon name={icon} size={18} className="mt-0.5 shrink-0 text-amber" />
                <span className="text-sand-card/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── CTA motorista ─── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6" id="motorista">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-line bg-sand-card p-8 shadow-card sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Vai pegar estrada? Leve gente com você.
            </h2>
            <p className="mt-2 max-w-xl text-ink/60">
              Você define o preço por assento — a plataforma só sugere. Banco livre
              vira renda: um Recife–Caruaru com 3 passageiros pode cobrir o custo da
              viagem inteira e ainda sobrar.
            </p>
          </div>
          <Link
            href="/motorista/comecar"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-sand-card transition hover:bg-ink-2"
          >
            <Icon name="car" size={17} />
            Oferecer carona
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Step({ n, icon, title, text }: { n: number; icon: string; title: string; text: string }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber/15 text-amber">
          <Icon name={icon} size={20} />
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-amber/70">Passo {n}</span>
      </div>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-sand-card/65">{text}</p>
    </div>
  );
}

function TierCard({
  name,
  desc,
  items,
  highlight = false,
}: {
  name: string;
  desc: string;
  items: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-6 ${
        highlight ? "border-amber bg-sand-card shadow-card-hover" : "border-line bg-sand-card shadow-card"
      }`}
    >
      <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
        {name}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{desc}</p>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-2 text-sm text-ink/75">
            <Icon name="check" size={14} className="text-trust" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
