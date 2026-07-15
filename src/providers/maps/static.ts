import { prisma } from "@/lib/prisma";
import { estimateDurationMin, estimateRoadDistanceKm, haversineKm } from "@/lib/geo";
import type { CityHit, MapsProvider, PlaceSuggestion, ResolvedPlace, RouteEstimate } from "./types";

/**
 * Provedor "static": autocomplete sobre o catálogo City (Postgres, ILIKE
 * sem acento via unaccent-like normalização) e rota estimada por haversine
 * × fator rodoviário. Sem dependência de rede — ideal para dev e demo.
 */
export class StaticMapsProvider implements MapsProvider {
  readonly name = "static";

  async searchCities(query: string, limit = 8): Promise<CityHit[]> {
    const q = normalize(query);
    if (q.length < 2) return [];
    const all = await prisma.city.findMany({ orderBy: { name: "asc" } });
    return all
      .filter((c) => normalize(c.name).includes(q) || c.slug.includes(q))
      .slice(0, limit)
      .map((c) => ({ name: c.name, state: c.state, slug: c.slug, lat: c.lat, lng: c.lng }));
  }

  async estimateRoute(
    origin: { lat: number; lng: number },
    dest: { lat: number; lng: number }
  ): Promise<RouteEstimate> {
    const straight = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
    const distanceKm = estimateRoadDistanceKm(straight);
    // curva suave (quadrática) entre os pontos para o desenho da rota
    const mid = {
      lat: (origin.lat + dest.lat) / 2 + 0.18,
      lng: (origin.lng + dest.lng) / 2,
    };
    const path = Array.from({ length: 17 }, (_, i) => {
      const t = i / 16;
      return {
        lat: (1 - t) ** 2 * origin.lat + 2 * (1 - t) * t * mid.lat + t ** 2 * dest.lat,
        lng: (1 - t) ** 2 * origin.lng + 2 * (1 - t) * t * mid.lng + t ** 2 * dest.lng,
      };
    });
    return { distanceKm, durationMin: estimateDurationMin(distanceKm), path };
  }

  async searchPlaces(): Promise<PlaceSuggestion[]> {
    return [];
  }

  async resolvePlace(): Promise<ResolvedPlace | null> {
    return null;
  }
}

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
