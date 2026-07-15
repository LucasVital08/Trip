import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMapsProvider } from "@/providers/maps";
import { StaticMapsProvider } from "@/providers/maps/static";

interface TripRouteSource {
  id: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  meetingLat: number | null;
  meetingLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  routeProvider: string;
  routePath: Prisma.JsonValue | null;
}

export async function getTripRoutePath(trip: TripRouteSource): Promise<Array<{ lat: number; lng: number }>> {
  const stored = parseRoutePath(trip.routePath);
  const maps = getMapsProvider();
  if (stored.length > 1 && (maps.name !== "google" || trip.routeProvider === "google")) return stored;

  const origin = coordinatesOrFallback(
    trip.meetingLat,
    trip.meetingLng,
    trip.originLat,
    trip.originLng
  );
  const dest = coordinatesOrFallback(
    trip.dropoffLat,
    trip.dropoffLng,
    trip.destLat,
    trip.destLng
  );
  let routeProvider = maps.name;
  let route;
  try {
    route = await maps.estimateRoute(origin, dest);
  } catch {
    if (stored.length > 1) return stored;
    route = await new StaticMapsProvider().estimateRoute(origin, dest);
    routeProvider = "static";
  }

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      routePath: route.path as Prisma.InputJsonValue,
      routeProvider,
      routeComputedAt: new Date(),
    },
  });
  return route.path;
}

export function parseRoutePath(value: Prisma.JsonValue | null): Array<{ lat: number; lng: number }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((point) => {
    if (!point || Array.isArray(point) || typeof point !== "object") return [];
    const lat = point.lat;
    const lng = point.lng;
    return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)
      ? [{ lat, lng }]
      : [];
  });
}

function coordinatesOrFallback(
  lat: number | null,
  lng: number | null,
  fallbackLat: number,
  fallbackLng: number
): { lat: number; lng: number } {
  return typeof lat === "number" && typeof lng === "number"
    ? { lat, lng }
    : { lat: fallbackLat, lng: fallbackLng };
}
