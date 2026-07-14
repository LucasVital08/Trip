import { createHash, randomBytes } from "node:crypto";
import type { MediaProvider, StoredMedia } from "./types";

function signature(params: Record<string, string | number>, secret: string): string {
  const payload = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(payload + secret).digest("hex");
}

export class CloudinaryMediaProvider implements MediaProvider {
  readonly name = "cloudinary";
  private readonly cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  private readonly apiKey = process.env.CLOUDINARY_API_KEY!;
  private readonly apiSecret = process.env.CLOUDINARY_API_SECRET!;

  constructor() {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error("Cloudinary requer CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.");
    }
  }

  async storeVehiclePhoto(input: {
    data: Buffer;
    contentType: string;
    extension: string;
  }): Promise<StoredMedia> {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "trip/vehicles";
    const publicId = `vehicle-${timestamp}-${randomBytes(8).toString("hex")}`;
    const signed = { folder, public_id: publicId, timestamp };
    const body = new FormData();
    body.set("file", new Blob([Uint8Array.from(input.data)], { type: input.contentType }), `${publicId}.${input.extension}`);
    body.set("api_key", this.apiKey);
    body.set("folder", folder);
    body.set("public_id", publicId);
    body.set("timestamp", String(timestamp));
    body.set("signature", signature(signed, this.apiSecret));

    const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
      method: "POST",
      body,
    });
    if (!response.ok) throw new Error(`Falha no upload da imagem (${response.status}).`);
    const result = await response.json() as { secure_url: string; public_id: string };
    return { url: result.secure_url, storageKey: result.public_id, provider: this.name };
  }

  async delete(storageKey: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = { public_id: storageKey, timestamp };
    const body = new URLSearchParams({
      public_id: storageKey,
      timestamp: String(timestamp),
      api_key: this.apiKey,
      signature: signature(signed, this.apiSecret),
    });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`, {
      method: "POST",
      body,
    });
    if (!response.ok) throw new Error(`Falha ao remover imagem (${response.status}).`);
  }
}
