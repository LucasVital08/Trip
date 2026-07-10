import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SortOption = "recomendado" | "preco" | "avaliacao" | "horario";

export interface SearchParams {
  origem?: string;
  destino?: string;
  data?: string; // yyyy-mm-dd
  opcionais?: string[]; // slugs (AND)
  faixa?: string[]; // tiers
  precoMax?: number; // centavos
  ordenar?: SortOption;
}

export const TRIP_CARD_INCLUDE = {
  driver: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      identityStatus: true,
      driverRatingAvg: true,
      driverRatingCount: true,
    },
  },
  vehicle: true,
  amenities: { include: { amenity: true } },
} satisfies Prisma.TripInclude;

export type TripCardData = Prisma.TripGetPayload<{ include: typeof TRIP_CARD_INCLUDE }>;

/**
 * Busca de viagens publicadas: rota (cidade exata, case-insensitive),
 * data (dia inteiro no fuso local), filtros de opcionais (AND), faixa de
 * experiência, teto de preço e ordenação.
 */
export async function searchTrips(params: SearchParams): Promise<TripCardData[]> {
  const where: Prisma.TripWhereInput = {
    status: "PUBLISHED",
    seatsAvailable: { gt: 0 },
    departAt: { gt: new Date() },
    driver: { blockedAt: null },
  };

  if (params.origem) where.originCity = { equals: params.origem, mode: "insensitive" };
  if (params.destino) where.destCity = { equals: params.destino, mode: "insensitive" };

  if (params.data) {
    const dayStart = new Date(`${params.data}T00:00:00-03:00`);
    if (!Number.isNaN(dayStart.getTime())) {
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);
      const lower = dayStart > new Date() ? dayStart : new Date();
      where.departAt = { gte: lower, lt: dayEnd };
    }
  }

  if (params.precoMax && params.precoMax > 0) {
    where.pricePerSeatCents = { lte: params.precoMax };
  }

  if (params.faixa?.length) {
    where.tier = { in: params.faixa.filter(isTier) };
  }

  if (params.opcionais?.length) {
    // exige TODOS os opcionais selecionados
    where.AND = params.opcionais.map((slug) => ({
      amenities: { some: { amenity: { slug } } },
    }));
  }

  const orderBy: Prisma.TripOrderByWithRelationInput[] =
    params.ordenar === "preco"
      ? [{ pricePerSeatCents: "asc" }, { departAt: "asc" }]
      : params.ordenar === "avaliacao"
        ? [{ driver: { driverRatingAvg: "desc" } }, { departAt: "asc" }]
        : params.ordenar === "horario"
          ? [{ departAt: "asc" }]
          : [{ departAt: "asc" }]; // "recomendado" reordena em memória abaixo

  const trips = await prisma.trip.findMany({ where, include: TRIP_CARD_INCLUDE, orderBy, take: 60 });

  if (!params.ordenar || params.ordenar === "recomendado") {
    // score: reputação (55%) + preço relativo (30%) + verificado (15%)
    const maxPrice = Math.max(...trips.map((t) => t.pricePerSeatCents), 1);
    return trips
      .map((t) => {
        const rep =
          t.driver.driverRatingCount > 0
            ? (t.driver.driverRatingAvg / 5) * Math.min(1, t.driver.driverRatingCount / 5)
            : 0.35; // motorista novo: score neutro
        const price = 1 - t.pricePerSeatCents / maxPrice;
        const verified = t.driver.identityStatus === "VERIFIED" ? 1 : 0;
        return { t, score: rep * 0.55 + price * 0.3 + verified * 0.15 };
      })
      .sort((a, b) => b.score - a.score || a.t.departAt.getTime() - b.t.departAt.getTime())
      .map((x) => x.t);
  }

  return trips;
}

function isTier(v: string): v is "ECONOMICO" | "CONFORTO" | "PREMIUM" {
  return v === "ECONOMICO" || v === "CONFORTO" || v === "PREMIUM";
}
