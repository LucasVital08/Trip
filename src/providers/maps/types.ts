/**
 * Interface do provedor de mapas/rotas.
 * Implementações: "static" (catálogo interno de cidades + estimativa
 * haversine — roda sem rede/credencial) e, futuramente, Google Maps
 * Platform ou Mapbox (Directions + Places).
 */
export interface CityHit {
  name: string;
  state: string;
  slug: string;
  lat: number;
  lng: number;
}

export interface RouteEstimate {
  distanceKm: number;
  durationMin: number;
  /** polyline simplificada (pares lat/lng) para desenhar a rota */
  path: Array<{ lat: number; lng: number }>;
}

export interface PlaceSuggestion {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText?: string;
}

export interface ResolvedPlace {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
}

export interface MapsProvider {
  readonly name: string;
  searchCities(query: string, limit?: number): Promise<CityHit[]>;
  estimateRoute(
    origin: { lat: number; lng: number },
    dest: { lat: number; lng: number }
  ): Promise<RouteEstimate>;
  searchPlaces(
    query: string,
    sessionToken: string,
    bias?: { lat: number; lng: number }
  ): Promise<PlaceSuggestion[]>;
  resolvePlace(placeId: string, sessionToken?: string): Promise<ResolvedPlace | null>;
}
