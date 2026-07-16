"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RouteMapProps } from "./route-map";

let configuredKey: string | null = null;

export function GoogleRouteMap({
  apiKey,
  mapId,
  origin,
  dest,
  path,
  className = "",
}: RouteMapProps & { apiKey: string; mapId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const routePath = useMemo(
    () => path && path.length > 1 ? path : [origin, dest],
    [path, origin, dest]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      const timeout = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timeout);
    }
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { rootMargin: "240px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !containerRef.current) return;
    let cancelled = false;
    let line: google.maps.Polyline | undefined;
    let markers: google.maps.marker.AdvancedMarkerElement[] = [];

    async function initialize() {
      try {
        if (!configuredKey) {
          setOptions({ key: apiKey, v: "quarterly", language: "pt-BR", region: "BR" });
          configuredKey = apiKey;
        }
        if (configuredKey !== apiKey) throw new Error("Chave do Google Maps divergente.");

        const [{ Map }, { AdvancedMarkerElement, PinElement }] = await Promise.all([
          importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
        ]);
        if (cancelled || !containerRef.current) return;

        const map = new Map(containerRef.current, {
          center: origin,
          zoom: 8,
          mapId: mapId || "DEMO_MAP_ID",
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          clickableIcons: false,
          gestureHandling: "cooperative",
          backgroundColor: "#2a1712",
        });

        line = new google.maps.Polyline({
          map,
          path: routePath,
          strokeColor: "#f2a65a",
          strokeOpacity: 1,
          strokeWeight: 5,
          geodesic: false,
        });

        const originPin = new PinElement({
          background: "#2a1712",
          borderColor: "#f2a65a",
          glyphColor: "#fffaf3",
        });
        const destPin = new PinElement({
          background: "#f2a65a",
          borderColor: "#2a1712",
          glyphColor: "#2a1712",
        });
        markers = [
          new AdvancedMarkerElement({ map, position: origin, title: origin.label, content: originPin.element }),
          new AdvancedMarkerElement({ map, position: dest, title: dest.label, content: destPin.element }),
        ];

        const bounds = new google.maps.LatLngBounds();
        routePath.forEach((point) => bounds.extend(point));
        bounds.extend(origin);
        bounds.extend(dest);
        map.fitBounds(bounds, 48);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      line?.setMap(null);
      markers.forEach((marker) => { marker.map = null; });
      markers = [];
    };
  }, [apiKey, mapId, origin, dest, routePath, visible]);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=driving`;

  return (
    <div className={`relative aspect-[4/3] min-h-[300px] w-full overflow-hidden rounded-2xl border border-line bg-[#2a1712] ${className}`}>
      <div
        ref={containerRef}
        role="img"
        aria-label={`Mapa interativo da rota de ${origin.label} a ${dest.label}`}
        className="h-full w-full"
      />
      {!visible && <div className="absolute inset-0 animate-pulse bg-[#2a1712]" aria-hidden="true" />}
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-[#2a1712] p-6 text-center text-sand-card">
          <div>
            <p className="font-bold">Não foi possível carregar o mapa agora.</p>
            <a className="mt-3 inline-flex rounded-full bg-amber px-4 py-2 text-sm font-bold text-ink" href={directionsUrl} target="_blank" rel="noreferrer">
              Abrir rota no Google Maps
            </a>
          </div>
        </div>
      )}
      {!failed && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-3 right-3 rounded-full bg-sand-card/95 px-3 py-1.5 text-xs font-bold text-ink shadow-card"
        >
          Abrir no Google Maps
        </a>
      )}
    </div>
  );
}
