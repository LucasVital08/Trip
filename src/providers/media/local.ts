import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MediaProvider, StoredMedia } from "./types";

export class LocalMediaProvider implements MediaProvider {
  readonly name = "local";

  async storeVehiclePhoto(input: {
    data: Buffer;
    contentType: string;
    extension: string;
  }): Promise<StoredMedia> {
    const filename = `${Date.now()}-${randomBytes(10).toString("hex")}.${input.extension}`;
    const directory = path.join(process.cwd(), "public", "uploads", "vehicles");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), input.data, { flag: "wx" });
    return {
      url: `/uploads/vehicles/${filename}`,
      storageKey: filename,
      provider: this.name,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const safeName = path.basename(storageKey);
    if (safeName !== storageKey) throw new Error("Chave de mídia inválida.");
    await unlink(path.join(process.cwd(), "public", "uploads", "vehicles", safeName)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
