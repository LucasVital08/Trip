import type { MediaProvider } from "./types";
import { CloudinaryMediaProvider } from "./cloudinary";
import { LocalMediaProvider } from "./local";

let instance: MediaProvider | null = null;

export function getMediaProvider(): MediaProvider {
  if (instance) return instance;
  const provider = process.env.MEDIA_PROVIDER ?? "local";
  if (provider === "cloudinary") instance = new CloudinaryMediaProvider();
  else if (provider === "local") {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_UPLOADS !== "true") {
      throw new Error("Uploads locais não são persistentes em produção. Configure MEDIA_PROVIDER=cloudinary.");
    }
    instance = new LocalMediaProvider();
  } else {
    throw new Error(`MEDIA_PROVIDER desconhecido: ${provider}`);
  }
  return instance;
}

export type { MediaProvider, StoredMedia } from "./types";
