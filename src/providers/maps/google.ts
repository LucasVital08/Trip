import { StaticMapsProvider } from "./static";
import type {
  CityHit,
  MapsProvider,
  PlaceSuggestion,
  ResolvedPlace,
  RouteEstimate,
} from "./types";

const ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";
const PLACES_URL = "https://places.googleapis.com/v1";

export class GoogleMapsProvider implements MapsProvider {
  readonly name = "google";
  private readonly catalog = new StaticMapsProvider();

  constructor(private readonly apiKey: string) {
    if (!apiKey) throw new Error("GOOGLE_MAPS_SERVER_KEY não configurada.");
  }

  searchCities(query: string, limit = 8): Promise<CityHit[]> {
    return this.catalog.searchCities(query, limit);
  }

  async estimateRoute(
    origin: { lat: number; lng: number },
    dest: { lat: number; lng: number }
  ): Promise<RouteEstimate> {
    const response = await fetch(ROUTES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: dest.lat, longitude: dest.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        languageCode: "pt-BR",
        units: "METRIC",
        polylineQuality: "OVERVIEW",
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Google Routes indisponível (${response.status}).`);
    }

    const payload = (await response.json()) as {
      routes?: Array<{
        distanceMeters?: number;
        duration?: string;
        polyline?: { encodedPolyline?: string };
      }>;
    };
    const route = payload.routes?.[0];
    const encoded = route?.polyline?.encodedPolyline;
    if (!route?.distanceMeters || !route.duration || !encoded) {
      throw new Error("Google Routes não retornou uma rota utilizável.");
    }

    const durationSeconds = Number.parseFloat(route.duration.replace(/s$/, ""));
    if (!Number.isFinite(durationSeconds)) {
      throw new Error("Google Routes retornou duração inválida.");
    }

    return {
      distanceKm: Math.max(1, Math.round(route.distanceMeters / 1_000)),
      durationMin: Math.max(1, Math.ceil(durationSeconds / 60)),
      path: decodeGooglePolyline(encoded),
    };
  }

  async searchPlaces(
    query: string,
    sessionToken: string,
    bias?: { lat: number; lng: number }
  ): Promise<PlaceSuggestion[]> {
    const input = query.trim();
    if (input.length < 3) return [];

    const response = await fetch(`${PLACES_URL}/places:autocomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": [
          "suggestions.placePrediction.placeId",
          "suggestions.placePrediction.text.text",
          "suggestions.placePrediction.structuredFormat.mainText.text",
          "suggestions.placePrediction.structuredFormat.secondaryText.text",
        ].join(","),
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ["br"],
        languageCode: "pt-BR",
        sessionToken,
        ...(bias
          ? {
              locationBias: {
                circle: {
                  center: { latitude: bias.lat, longitude: bias.lng },
                  radius: 50_000,
                },
              },
            }
          : {}),
      }),
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });

    if (!response.ok) return [];
    const payload = (await response.json()) as {
      suggestions?: Array<{
        placePrediction?: {
          placeId?: string;
          text?: { text?: string };
          structuredFormat?: {
            mainText?: { text?: string };
            secondaryText?: { text?: string };
          };
        };
      }>;
    };

    return (payload.suggestions ?? []).flatMap(({ placePrediction }) => {
      const placeId = placePrediction?.placeId;
      const label = placePrediction?.text?.text;
      if (!placeId || !label) return [];
      return [{
        placeId,
        label,
        mainText: placePrediction.structuredFormat?.mainText?.text ?? label,
        secondaryText: placePrediction.structuredFormat?.secondaryText?.text,
      }];
    });
  }

  async resolvePlace(placeId: string, sessionToken?: string): Promise<ResolvedPlace | null> {
    if (!placeId) return null;
    const query = new URLSearchParams({ languageCode: "pt-BR" });
    if (sessionToken) query.set("sessionToken", sessionToken);

    const response = await fetch(`${PLACES_URL}/places/${encodeURIComponent(placeId)}?${query}`, {
      headers: {
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
      },
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const place = (await response.json()) as {
      id?: string;
      formattedAddress?: string;
      displayName?: { text?: string };
      location?: { latitude?: number; longitude?: number };
    };
    const lat = place.location?.latitude;
    const lng = place.location?.longitude;
    if (!place.id || typeof lat !== "number" || typeof lng !== "number") return null;

    return {
      placeId: place.id,
      label: place.formattedAddress ?? place.displayName?.text ?? place.id,
      lat,
      lng,
    };
  }
}

export function decodeGooglePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const path: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    const latitude = decodeValue(encoded, index);
    index = latitude.nextIndex;
    const longitude = decodeValue(encoded, index);
    index = longitude.nextIndex;
    lat += latitude.delta;
    lng += longitude.delta;
    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return path;
}

function decodeValue(encoded: string, startIndex: number): { delta: number; nextIndex: number } {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte: number;

  do {
    if (index >= encoded.length) throw new Error("Polyline inválida.");
    byte = encoded.charCodeAt(index++) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  return {
    delta: result & 1 ? ~(result >> 1) : result >> 1,
    nextIndex: index,
  };
}
