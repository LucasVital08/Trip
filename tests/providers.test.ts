import { describe, expect, it } from "vitest";
import { MockPaymentProvider } from "@/providers/payments/mock";
import { MockKycProvider, isValidCpf } from "@/providers/kyc/mock";
import { parseBRLToCents } from "@/lib/money";
import { generateBookingCode } from "@/lib/booking-code";

describe("MockPaymentProvider", () => {
  const provider = new MockPaymentProvider();
  const base = {
    bookingId: "bk_1",
    bookingCode: "TRP-TEST01",
    amountCents: 5040,
    serviceFeeCents: 540,
    driverAmountCents: 4500,
    customer: { id: "u1", name: "Teste", email: "t@t.dev" },
  };

  it("Pix fica pendente e gera copia-e-cola", async () => {
    const r = await provider.createCharge({ ...base, method: "PIX" });
    expect(r.status).toBe("pending");
    expect(r.pixQrCode).toContain("BR.GOV.BCB.PIX");
  });

  it("cartão comum aprova na hora", async () => {
    const r = await provider.createCharge({ ...base, method: "CARD", cardToken: "tok_mock_4242" });
    expect(r.status).toBe("paid");
    expect(r.cardLast4).toBe("4242");
  });

  it("cartão de teste 0002 é recusado", async () => {
    const r = await provider.createCharge({ ...base, method: "CARD", cardToken: "tok_mock_0002" });
    expect(r.status).toBe("failed");
    expect(r.failReason).toBeTruthy();
  });

  it("webhook exige assinatura válida", async () => {
    const body = JSON.stringify({ type: "payment.paid", providerRef: "x", bookingId: "y" });
    expect(await provider.parseWebhook(body, "assinatura-errada")).toBeNull();
    expect(await provider.parseWebhook(body, null)).toBeNull();
    const ok = await provider.parseWebhook(body, "mock-signature");
    expect(ok).toEqual({ type: "payment.paid", providerRef: "x", bookingId: "y" });
  });

  it("webhook rejeita payload malformado", async () => {
    expect(await provider.parseWebhook("não é json", "mock-signature")).toBeNull();
    expect(await provider.parseWebhook(JSON.stringify({ type: "outro" }), "mock-signature")).toBeNull();
  });
});

describe("MockKycProvider / CPF", () => {
  it("valida dígitos verificadores de CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true); // CPF de exemplo válido
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });

  it("aprova nome completo + CPF válido; rejeita inválido", async () => {
    const kyc = new MockKycProvider();
    const ok = await kyc.submit({ userId: "u1", fullName: "Maria da Silva", documentNumber: "529.982.247-25" });
    expect(ok.status).toBe("VERIFIED");
    const bad = await kyc.submit({ userId: "u1", fullName: "Maria", documentNumber: "529.982.247-25" });
    expect(bad.status).toBe("REJECTED");
  });
});

describe("utilidades", () => {
  it("parseBRLToCents entende formatos brasileiros", () => {
    expect(parseBRLToCents("45")).toBe(4500);
    expect(parseBRLToCents("45,50")).toBe(4550);
    expect(parseBRLToCents("R$ 1.250,00")).toBe(125000);
    expect(parseBRLToCents("abc")).toBeNull();
  });

  it("código de reserva tem formato TRP-XXXXXX sem caracteres ambíguos", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateBookingCode();
      expect(code).toMatch(/^TRP-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });
});
