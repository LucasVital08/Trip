import { describe, expect, it } from "vitest";
import {
  computeBookingPrice,
  computeRefundCents,
  suggestPricePerSeat,
} from "@/lib/pricing";

describe("computeBookingPrice — composição do preço com taxa Trip", () => {
  it("aplica 12% de taxa sobre o subtotal do motorista", () => {
    const p = computeBookingPrice(4500, 1, 12, 0);
    expect(p.subtotalCents).toBe(4500);
    expect(p.serviceFeeCents).toBe(540);
    expect(p.totalCents).toBe(5040);
    expect(p.driverAmountCents).toBe(4500); // motorista recebe integral
  });

  it("multiplica por assentos antes da taxa", () => {
    const p = computeBookingPrice(4500, 3, 12, 0);
    expect(p.subtotalCents).toBe(13500);
    expect(p.serviceFeeCents).toBe(1620);
    expect(p.totalCents).toBe(15120);
  });

  it("arredonda a taxa para o centavo mais próximo", () => {
    // 3333 × 12% = 399,96 → 400
    expect(computeBookingPrice(3333, 1, 12, 0).serviceFeeCents).toBe(400);
  });

  it("suporta taxa fixa adicional (gancho de monetização)", () => {
    const p = computeBookingPrice(10000, 1, 12, 200);
    expect(p.serviceFeeCents).toBe(1400);
    expect(p.totalCents).toBe(11400);
  });

  it("rejeita valores inválidos", () => {
    expect(() => computeBookingPrice(0, 1)).toThrow();
    expect(() => computeBookingPrice(-100, 1)).toThrow();
    expect(() => computeBookingPrice(4500, 0)).toThrow();
    expect(() => computeBookingPrice(45.5 as unknown as number, 1)).toThrow();
  });
});

describe("computeRefundCents — política de cancelamento", () => {
  const depart = new Date("2026-08-10T08:00:00-03:00");
  const total = 10000;

  it("reembolso integral com 24h+ de antecedência", () => {
    const at = new Date("2026-08-09T07:59:00-03:00");
    expect(computeRefundCents(total, depart, at)).toBe(10000);
  });

  it("reembolso de 50% entre 24h e 3h", () => {
    const at = new Date("2026-08-10T00:00:00-03:00");
    expect(computeRefundCents(total, depart, at)).toBe(5000);
  });

  it("sem reembolso a menos de 3h", () => {
    const at = new Date("2026-08-10T06:30:00-03:00");
    expect(computeRefundCents(total, depart, at)).toBe(0);
  });

  it("fronteira exata de 24h conta como integral", () => {
    const at = new Date("2026-08-09T08:00:00-03:00");
    expect(computeRefundCents(total, depart, at)).toBe(10000);
  });
});

describe("suggestPricePerSeat — sugestão referencial", () => {
  it("gera faixa coerente para Recife–Caruaru (~155 km, 3 assentos)", () => {
    const s = suggestPricePerSeat(155, 3);
    expect(s.lowCents).toBeGreaterThanOrEqual(1000);
    expect(s.highCents).toBeGreaterThan(s.lowCents);
    // rateio: (155×62 + 1.55×350)/4 ≈ 2538
    expect(s.costShareCents).toBe(2538);
  });

  it("nunca sugere abaixo do preço mínimo da plataforma", () => {
    const s = suggestPricePerSeat(5, 4);
    expect(s.lowCents).toBeGreaterThanOrEqual(1000);
  });
});
