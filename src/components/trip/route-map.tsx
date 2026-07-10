/**
 * Mapa SVG da rota — desenhado localmente (provedor "static"), sem tiles
 * externos. Contorno estilizado do litoral NE + rota tracejada em âmbar.
 * Ao trocar para Google/Mapbox, este componente é o ponto de substituição.
 */

const NE_BOUNDS = { minLat: -13.8, maxLat: -2.2, minLng: -45.2, maxLng: -33.8 };

// contorno bem simplificado do litoral do Nordeste (lat, lng)
const COASTLINE: Array<[number, number]> = [
  [-2.53, -44.3], [-2.8, -42.8], [-2.9, -41.8], [-3.2, -40.9], [-3.71, -38.54],
  [-4.3, -37.8], [-4.9, -37.2], [-5.19, -36.5], [-5.5, -35.4], [-5.79, -35.21],
  [-6.5, -34.95], [-7.12, -34.85], [-7.9, -34.83], [-8.05, -34.87], [-8.7, -35.05],
  [-9.4, -35.5], [-9.65, -35.71], [-10.3, -36.3], [-10.91, -37.05], [-11.5, -37.35],
  [-12.5, -38.1], [-12.97, -38.5], [-13.6, -38.9],
];

function project(lat: number, lng: number, w: number, h: number): [number, number] {
  const x = ((lng - NE_BOUNDS.minLng) / (NE_BOUNDS.maxLng - NE_BOUNDS.minLng)) * w;
  const y = ((NE_BOUNDS.maxLat - lat) / (NE_BOUNDS.maxLat - NE_BOUNDS.minLat)) * h;
  return [x, y];
}

export function RouteMap({
  origin,
  dest,
  path,
  className = "",
}: {
  origin: { lat: number; lng: number; label: string };
  dest: { lat: number; lng: number; label: string };
  path?: Array<{ lat: number; lng: number }>;
  className?: string;
}) {
  const W = 640;
  const H = 480;
  const coast = COASTLINE.map(([lat, lng]) => project(lat, lng, W, H));
  const coastD = coast.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  // polígono do "continente" fechando pela esquerda
  const landD = `${coastD} L0,${H} L0,0 Z`;

  const [ox, oy] = project(origin.lat, origin.lng, W, H);
  const [dx, dy] = project(dest.lat, dest.lng, W, H);
  const routePoints = (path && path.length > 1
    ? path.map((p) => project(p.lat, p.lng, W, H))
    : [
        [ox, oy],
        [(ox + dx) / 2, (oy + dy) / 2 - 30],
        [dx, dy],
      ]) as Array<[number, number]>;
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
      {/* oceano */}
      <rect width={W} height={H} fill="#13303d" />
      {/* continente */}
      <path d={landD} fill="#0b1f2a" stroke="#1d4152" strokeWidth="2" />
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
      <circle cx={ox} cy={oy} r="7" fill="#0b1f2a" stroke="#f2a65a" strokeWidth="3" />
      <text x={ox + labelDx(ox)} y={oy + 4} textAnchor={labelAnchor(ox)} fontSize="17" fontWeight="700" fill="#f5efe6" fontFamily="var(--font-sans)">
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
