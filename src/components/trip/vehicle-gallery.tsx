import Image from "next/image";

export function VehicleGallery({
  photos,
  vehicleName,
}: {
  photos: Array<{ id: string; url: string }>;
  vehicleName: string;
}) {
  if (photos.length === 0) return null;
  const [cover, ...rest] = photos;
  return (
    <div className="mb-5 grid aspect-[16/9] grid-cols-4 grid-rows-2 gap-1 overflow-hidden rounded-2xl sm:aspect-[2/1]">
      <div className={`${rest.length ? "col-span-3" : "col-span-4"} row-span-2 relative`}>
        <Image src={cover.url} alt={`${vehicleName} — foto principal`} fill unoptimized priority sizes="(max-width: 1024px) 100vw, 700px" className="object-cover" />
      </div>
      {rest.slice(0, 2).map((photo, index) => (
        <div key={photo.id} className="relative col-span-1 row-span-1">
          <Image src={photo.url} alt={`${vehicleName} — foto ${index + 2}`} fill unoptimized sizes="200px" className="object-cover" />
          {index === 1 && rest.length > 2 && (
            <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-sm font-bold text-white">+{rest.length - 2}</span>
          )}
        </div>
      ))}
    </div>
  );
}
