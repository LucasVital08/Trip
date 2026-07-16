/**
 * Mapa SVG nacional do provedor "static", com enquadramento automático.
 * Quando as credenciais existem, o wrapper usa o Google Maps interativo.
 */

import { GoogleRouteMap } from "@/components/trip/google-route-map";

export interface RouteMapProps {
  origin: { lat: number; lng: number; label: string };
  dest: { lat: number; lng: number; label: string };
  path?: Array<{ lat: number; lng: number }>;
  className?: string;
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const PADDING_RATIO = 0.35;
const MIN_GEO_SPAN = 0.6;

function calculateBounds(points: Array<{ lat: number; lng: number }>): Bounds {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latSpan = Math.max(maxLat - minLat, MIN_GEO_SPAN) * (1 + PADDING_RATIO * 2);
  const lngSpan = Math.max(maxLng - minLng, MIN_GEO_SPAN) * (1 + PADDING_RATIO * 2);
  return {
    minLat: centerLat - latSpan / 2,
    maxLat: centerLat + latSpan / 2,
    minLng: centerLng - lngSpan / 2,
    maxLng: centerLng + lngSpan / 2,
  };
}

function project(lat: number, lng: number, bounds: Bounds, w: number, h: number): [number, number] {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * w;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * h;
  return [x, y];
}

export function RouteMap(props: RouteMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  if (apiKey) {
    return (
      <GoogleRouteMap
        {...props}
        apiKey={apiKey}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
      />
    );
  }
  return <StaticRouteMap {...props} />;
}

function StaticRouteMap({
  origin,
  dest,
  path,
  className = "",
}: RouteMapProps) {
  const W = 640;
  const H = 480;
  const geoPath = path && path.length > 1
    ? path
    : [
        origin,
        {
          lat: (origin.lat + dest.lat) / 2 + Math.max(Math.abs(origin.lat - dest.lat) * 0.08, 0.04),
          lng: (origin.lng + dest.lng) / 2,
        },
        dest,
      ];
  const bounds = calculateBounds([origin, dest, ...geoPath]);
  const [ox, oy] = project(origin.lat, origin.lng, bounds, W, H);
  const [dx, dy] = project(dest.lat, dest.lng, bounds, W, H);
  const routePoints = geoPath.map((point) => project(point.lat, point.lng, bounds, W, H));
  const routeD = routePoints
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const labelAnchor = (x: number) => (x > W - 130 ? "end" : "start");
  const labelDx = (x: number) => (x > W - 130 ? -12 : 12);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Mapa da rota de ${origin.label} a ${dest.label}`}
      className={`h-auto w-full rounded-2xl border border-line ${className}`}
    >
      <defs>
        <radialGradient id="route-earth-night" cx="50%" cy="42%" r="72%">
          <stop offset="0%" stopColor="#3b241b" />
          <stop offset="100%" stopColor="#2a1712" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#route-earth-night)" />
      {/* grade sutil */}
      {Array.from({ length: 7 }, (_, i) => (
        <line key={`v${i}`} x1={(i + 1) * (W / 8)} y1="0" x2={(i + 1) * (W / 8)} y2={H} stroke="#ffffff" strokeOpacity="0.03" />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={(i + 1) * (H / 6)} x2={W} y2={(i + 1) * (H / 6)} stroke="#ffffff" strokeOpacity="0.03" />
      ))}
      {/* rota */}
      <path d={routeD} fill="none" stroke="#f2a65a" strokeWidth="3.5" strokeDasharray="10 8" strokeLinecap="round" />
      {/* origem */}
      <circle cx={ox} cy={oy} r="7" fill="#2a1712" stroke="#f2a65a" strokeWidth="3" />
      <text x={ox + labelDx(ox)} y={oy + 4} textAnchor={labelAnchor(ox)} fontSize="17" fontWeight="700" fill="#fffaf3" fontFamily="var(--font-sans)">
        {origin.label}
      </text>
      {/* destino */}
      <circle cx={dx} cy={dy} r="7" fill="#f2a65a" />
      <text x={dx + labelDx(dx)} y={dy + 4} textAnchor={labelAnchor(dx)} fontSize="17" fontWeight="700" fill="#f2a65a" fontFamily="var(--font-sans)">
        {dest.label}
      </text>
    </svg>
  );
}
