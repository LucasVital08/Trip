import { describe, expect, it } from "vitest";
import { deriveTier, tierScore } from "@/lib/tier";

const YEAR = 2026;

describe("deriveTier — faixa de experiência", () => {
  it("carro básico antigo sem extras → Econômico", () => {
    expect(
      deriveTier({ amenityWeights: [], vehicleYear: 2015, vehicleCategory: "HATCH", currentYear: YEAR })
    ).toBe("ECONOMICO");
  });

  it("preferências de convivência (peso 0) não mudam a faixa", () => {
    expect(
      deriveTier({ amenityWeights: [0, 0, 0], vehicleYear: 2015, vehicleCategory: "HATCH", currentYear: YEAR })
    ).toBe("ECONOMICO");
  });

  it("ar + água + carro seminovo → Conforto", () => {
    // ar(2) + água(1) = 3, hatch 2021 (idade 5 → +1) = 4
    expect(
      deriveTier({ amenityWeights: [2, 1], vehicleYear: 2021, vehicleCategory: "HATCH", currentYear: YEAR })
    ).toBe("CONFORTO");
  });

  it("pacote completo em SUV novo → Premium", () => {
    // ar(2)+wifi(2)+água(1)+usb(1) = 6, SUV +2, novo +2 = 10
    expect(
      deriveTier({ amenityWeights: [2, 2, 1, 1], vehicleYear: 2024, vehicleCategory: "SUV", currentYear: YEAR })
    ).toBe("PREMIUM");
  });

  it("fronteiras: score 4 é Conforto, score 9 é Premium", () => {
    expect(tierScore({ amenityWeights: [2], vehicleYear: 2010, vehicleCategory: "SEDAN", currentYear: YEAR })).toBe(3);
    expect(
      deriveTier({ amenityWeights: [2, 1], vehicleYear: 2010, vehicleCategory: "SEDAN", currentYear: YEAR })
    ).toBe("CONFORTO"); // 3+1 = 4
    expect(
      deriveTier({ amenityWeights: [2, 2, 1], vehicleYear: 2024, vehicleCategory: "SEDAN", currentYear: YEAR })
    ).toBe("CONFORTO"); // 5+2+1 = 8
    expect(
      deriveTier({ amenityWeights: [2, 2, 1, 1], vehicleYear: 2024, vehicleCategory: "SEDAN", currentYear: YEAR })
    ).toBe("PREMIUM"); // 6+2+1 = 9
  });
});
