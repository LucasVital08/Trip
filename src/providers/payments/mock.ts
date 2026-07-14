import { randomBytes } from "crypto";
import type {
  ChargeResult,
  CreateChargeInput,
  PaymentProvider,
  RefundResult,
  WebhookEvent,
} from "./types";

/**
 * Provedor de pagamento simulado para desenvolvimento e testes.
 *
 * - Pix: gera um "copia-e-cola" fake e fica pendente; a confirmação chega
 *   pelo webhook interno (o checkout de dev tem um botão "simular pagamento",
 *   que chama /api/webhooks/payment com a assinatura mock).
 * - Cartão: aprova na hora (síncrono), exceto cartões terminados em "0002"
 *   (recusado — mesmo padrão de cartão de teste do Stripe).
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const providerRef = `mock_ch_${randomBytes(8).toString("hex")}`;
    if (input.method === "PIX") {
      const pixQrCode = [
        "00020126580014BR.GOV.BCB.PIX0136",
        randomBytes(16).toString("hex"),
        "5204000053039865802BR5910TRIP LTDA6009RECIFE",
        `62${String(input.bookingCode.length + 4).padStart(2, "0")}05${input.bookingCode}`,
        "6304MOCK",
      ].join("");
      return { providerRef, status: "pending", pixQrCode };
    }
    const last4 = input.cardToken?.slice(-4) ?? "4242";
    if (last4 === "0002") {
      return { providerRef, status: "failed", cardLast4: last4, failReason: "Cartão recusado pelo emissor (cartão de teste)." };
    }
    return { providerRef, status: "paid", cardLast4: last4 };
  }

  async refund(providerRef: string, amountCents: number): Promise<RefundResult> {
    return { providerRef, refundedCents: amountCents };
  }

  async cancelCharge(_providerRef: string): Promise<void> {
    // Cobranças mock não possuem estado externo.
  }

  async parseWebhook(rawBody: string, signature: string | null): Promise<WebhookEvent | null> {
    if (signature !== "mock-signature") return null;
    try {
      const body = JSON.parse(rawBody);
      if (
        (body.type === "payment.paid" || body.type === "payment.failed" || body.type === "payment.refunded") &&
        typeof body.providerRef === "string" &&
        typeof body.bookingId === "string"
      ) {
        return { type: body.type, providerRef: body.providerRef, bookingId: body.bookingId };
      }
    } catch {
      // corpo inválido
    }
    return null;
  }

  async transferToDriver(_driverAccountRef: string, _amountCents: number) {
    return { transferRef: `mock_tr_${randomBytes(8).toString("hex")}` };
  }
}
