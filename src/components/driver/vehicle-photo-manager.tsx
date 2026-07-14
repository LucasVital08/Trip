"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_VEHICLE_PHOTOS } from "@/lib/vehicle-photo";

interface Photo {
  id: string;
  url: string;
}

export function VehiclePhotoManager({
  vehicleId,
  vehicleName,
  photos,
}: {
  vehicleId: string;
  vehicleName: string;
  photos: Photo[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    Array.from(files).forEach((file) => body.append("photos", file));
    const response = await fetch(`/api/vehicles/${vehicleId}/photos`, { method: "POST", body });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Não foi possível enviar as fotos.");
    else router.refresh();
    if (inputRef.current) inputRef.current.value = "";
    setBusy(false);
  }

  async function mutate(method: "DELETE" | "PATCH", photoId: string) {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/vehicles/${vehicleId}/photos`, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Não foi possível atualizar a galeria.");
    else router.refresh();
    setBusy(false);
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">Fotos do veículo</p>
          <p className="text-xs text-ink/50">{photos.length}/{MAX_VEHICLE_PHOTOS} · a primeira foto é a capa</p>
        </div>
        {photos.length < MAX_VEHICLE_PHOTOS && (
          <label className={`cursor-pointer rounded-full bg-ink px-4 py-2 text-xs font-bold text-sand-card ${busy ? "pointer-events-none opacity-50" : ""}`}>
            {busy ? "Enviando…" : "+ Adicionar fotos"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={(event) => upload(event.target.files)}
            />
          </label>
        )}
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{error}</p>}
      {photos.length === 0 ? (
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 w-full rounded-2xl border border-dashed border-line bg-sand px-4 py-6 text-center text-sm text-ink/55 hover:border-amber-deep">
          Adicione fotos da frente, lateral, interior e porta-malas para dar previsibilidade a quem vai viajar.
        </button>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand">
              <Image src={photo.url} alt={`${vehicleName} — foto ${index + 1}`} fill unoptimized sizes="(max-width: 640px) 50vw, 180px" className="object-cover" />
              {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-1 text-[10px] font-bold text-white">Capa</span>}
              <div className="absolute inset-x-1 bottom-1 flex justify-end gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                {index > 0 && (
                  <button type="button" disabled={busy} onClick={() => mutate("PATCH", photo.id)} className="rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-ink shadow">Usar como capa</button>
                )}
                <button type="button" disabled={busy} onClick={() => mutate("DELETE", photo.id)} className="rounded-full bg-red-700/95 px-2 py-1 text-[10px] font-bold text-white shadow">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
