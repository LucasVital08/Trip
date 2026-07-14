export const MAX_VEHICLE_PHOTOS = 8;
export const MAX_VEHICLE_PHOTO_BYTES = 5 * 1024 * 1024;

const CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateVehiclePhoto(data: Uint8Array, contentType: string): { extension: string } | { error: string } {
  const extension = CONTENT_TYPES[contentType];
  if (!extension) return { error: "Use imagens JPG, PNG ou WebP." };
  if (data.byteLength === 0 || data.byteLength > MAX_VEHICLE_PHOTO_BYTES) {
    return { error: "Cada foto deve ter no máximo 5 MB." };
  }
  const isJpeg = data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  const isPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => data[index] === byte);
  const isWebp = String.fromCharCode(...data.slice(0, 4)) === "RIFF" && String.fromCharCode(...data.slice(8, 12)) === "WEBP";
  if ((extension === "jpg" && !isJpeg) || (extension === "png" && !isPng) || (extension === "webp" && !isWebp)) {
    return { error: "O conteúdo do arquivo não corresponde ao formato informado." };
  }
  return { extension };
}
