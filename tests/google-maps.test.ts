import { describe, expect, it } from "vitest";
import { decodeGooglePolyline } from "@/providers/maps/google";

describe("decodeGooglePolyline", () => {
  it("decodifica o exemplo oficial do algoritmo de polyline", () => {
    expect(decodeGooglePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@"))
      .toEqual([
        { lat: 38.5, lng: -120.2 },
        { lat: 40.7, lng: -120.95 },
        { lat: 43.252, lng: -126.453 },
      ]);
  });

  it("rejeita uma polyline truncada", () => {
    expect(() => decodeGooglePolyline("_")).toThrow("Polyline inválida");
  });
});
