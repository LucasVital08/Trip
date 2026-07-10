/** Distância haversine em km entre dois pontos. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Fator médio rodovia/linha reta no Brasil (estradas não são retas).
 * Usado pelo provedor de mapas "static" para estimar distância rodoviária.
 */
export const ROAD_FACTOR = 1.25;

/** Velocidade média rodoviária estimada (km/h) para duração da viagem. */
export const AVG_ROAD_SPEED_KMH = 75;

export function estimateRoadDistanceKm(straightKm: number): number {
  return Math.round(straightKm * ROAD_FACTOR);
}

export function estimateDurationMin(roadKm: number): number {
  return Math.round((roadKm / AVG_ROAD_SPEED_KMH) * 60);
}
