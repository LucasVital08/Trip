import type { MapsProvider } from "./types";
import { StaticMapsProvider } from "./static";
import { GoogleMapsProvider } from "./google";

let instance: MapsProvider | null = null;

export function getMapsProvider(): MapsProvider {
  if (instance) return instance;
  if (process.env.MAPS_PROVIDER?.toLowerCase() === "google" && process.env.GOOGLE_MAPS_SERVER_KEY) {
    instance = new GoogleMapsProvider(process.env.GOOGLE_MAPS_SERVER_KEY);
    return instance;
  }
  instance = new StaticMapsProvider();
  return instance;
}

export type {
  MapsProvider,
  CityHit,
  PlaceSuggestion,
  ResolvedPlace,
  RouteEstimate,
} from "./types";
