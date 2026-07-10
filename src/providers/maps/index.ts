import type { MapsProvider } from "./types";
import { StaticMapsProvider } from "./static";

let instance: MapsProvider | null = null;

export function getMapsProvider(): MapsProvider {
  if (instance) return instance;
  // Gancho: case "google": new GoogleMapsProvider(process.env.GOOGLE_MAPS_API_KEY)
  instance = new StaticMapsProvider();
  return instance;
}

export type { MapsProvider, CityHit, RouteEstimate } from "./types";
