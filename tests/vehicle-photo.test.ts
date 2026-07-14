import { describe, expect, it } from "vitest";
import { MAX_VEHICLE_PHOTO_BYTES, validateVehiclePhoto } from "@/lib/vehicle-photo";

describe("validateVehiclePhoto", () => {
  it("aceita assinaturas reais de JPG, PNG e WebP", () => {
    expect(validateVehiclePhoto(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg")).toEqual({ extension: "jpg" });
    expect(validateVehiclePhoto(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toEqual({ extension: "png" });
    expect(validateVehiclePhoto(Uint8Array.from([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]), "image/webp")).toEqual({ extension: "webp" });
  });

  it("rejeita tipo, conteúdo forjado e tamanho excessivo", () => {
    expect(validateVehiclePhoto(Uint8Array.from([1, 2, 3]), "image/gif")).toHaveProperty("error");
    expect(validateVehiclePhoto(Uint8Array.from([1, 2, 3]), "image/jpeg")).toHaveProperty("error");
    expect(validateVehiclePhoto(new Uint8Array(MAX_VEHICLE_PHOTO_BYTES + 1), "image/png")).toHaveProperty("error");
  });
});
