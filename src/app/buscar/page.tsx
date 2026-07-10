import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { searchTrips, type SortOption } from "@/lib/search";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchForm } from "@/components/search/search-form";
import { TripCard } from "@/components/trip/trip-card";
import { Filters } from "@/components/search/filters";
import { Icon } from "@/components/ui/icon";
import { RoadDivider } from "@/components/ui/road-divider";

export const metadata: Metadata = { title: "Buscar viagem" };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function many(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).flatMap((s) => s.split(",")).filter(Boolean);
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  // origem/destino chegam como slug (form) ou como nome (links de rota)
  const [originCity, destCity] = await Promise.all([
    resolveCity(first(sp.origem), first(sp.origemNome)),
    resolveCity(first(sp.destino), first(sp.destinoNome)),
  ]);

  const opcionais = many(sp.opcionais);
  const faixa = many(sp.faixa);
  const precoMaxBRL = Number(first(sp.precoMax) ?? 0);
  const ordenar = (first(sp.ordenar) as SortOption) || "recomendado";
  const data = first(sp.data);

  const [trips, amenities] = await Promise.all([
    searchTrips({
      origem: originCity?.name,
      destino: destCity?.name,
      data,
      opcionais,
      faixa,
      // 300 no slider = "sem teto"
      precoMax: precoMaxBRL > 0 && precoMaxBRL < 300 ? precoMaxBRL * 100 : undefined,
      ordenar,
    }),
    prisma.amenity.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const routeLabel =
    originCity && destCity
      ? `${originCity.name} → ${destCity.name}`
      : originCity
        ? `Saindo de ${originCity.name}`
        : destCity
          ? `Indo para ${destCity.name}`
          : "Todas as viagens";

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <section className="border-b border-line bg-sand-card">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <SearchForm
            compact
            defaults={{
              origem: originCity?.slug,
              origemLabel: originCity ? `${originCity.name}, ${originCity.state}` : undefined,
              destino: destCity?.slug,
              destinoLabel: destCity ? `${destCity.name}, ${destCity.state}` : undefined,
              data,
            }}
          />
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {routeLabel}
            </h1>
            <p className="mt-1 text-sm text-ink/55">
              {trips.length} {trips.length === 1 ? "viagem disponível" : "viagens disponíveis"}
              {data && <> · {new Date(`${data}T12:00:00-03:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</>}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <Filters
            amenities={amenities.map((a) => ({ slug: a.slug, label: a.label, icon: a.icon }))}
            current={{ opcionais, faixa, precoMax: precoMaxBRL || undefined, ordenar }}
            passthrough={{
              origem: originCity?.slug,
              destino: destCity?.slug,
              data,
            }}
          />

          <div className="space-y-4">
            {trips.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line bg-sand-card px-6 py-16 text-center">
                <Icon name="route" size={40} className="mx-auto text-ink/25" />
                <h2 className="mt-4 text-lg font-bold">Nenhuma viagem por aqui (ainda)</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-ink/55">
                  Tente outra data, remova filtros — ou seja quem abre a rota:
                  publique essa viagem como motorista.
                </p>
                <div className="mx-auto mt-6 max-w-[200px]">
                  <RoadDivider subtle />
                </div>
              </div>
            ) : (
              trips.map((t) => <TripCard key={t.id} trip={t} />)
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

async function resolveCity(slug?: string, nome?: string) {
  if (slug) {
    const c = await prisma.city.findUnique({ where: { slug } });
    if (c) return c;
  }
  if (nome) {
    const c = await prisma.city.findFirst({ where: { name: { equals: nome, mode: "insensitive" } } });
    if (c) return c;
  }
  return null;
}
