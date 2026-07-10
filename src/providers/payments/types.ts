/**
 * Interface do provedor de pagamentos (marketplace com split).
 *
 * O provedor deve suportar:
 *  - cobrança com split: taxa da plataforma retida, restante destinado ao motorista;
 *  - Pix e cartão de crédito;
 *  - escrow: repasse ao motorista liberado após a viagem;
 *  - reembolso total/parcial;
 *  - confirmação assíncrona por webhook.
 *
 * Implementações: MockPaymentProvider (dev/testes, sem credencial) e
 * StripePaymentProvider (Stripe Connect, destination charges). Trocar de
 * provedor = implementar esta interface + registrar em index.ts.
 */

export type PaymentMethodKind = "PIX" | "CARD";

export interface CreateChargeInput {
  bookingId: string;
  bookingCode: string;
  method: PaymentMethodKind;
  /** total cobrado do passageiro (centavos) */
  amountCents: number;
  /** parcela retida pela plataforma (centavos) */
  serviceFeeCents: number;
  /** parcela destinada ao motorista (centavos) */
  driverAmountCents: number;
  /** identificação do recebedor (motorista) no provedor */
  driverAccountRef?: string;
  customer: { id: string; name: string; email: string };
  /** dados de cartão tokenizados no cliente (nunca PAN cru) */
  cardToken?: string;
}

export interface ChargeResult {
  providerRef: string;
  status: "pending" | "paid" | "failed";
  /** copia-e-cola do Pix, quando method === "PIX" */
  pixQrCode?: string;
  /** últimos 4 dígitos, quando cartão */
  cardLast4?: string;
  failReason?: string;
}

export interface RefundResult {
  providerRef: string;
  refundedCents: number;
}

export interface WebhookEvent {
  type: "payment.paid" | "payment.failed" | "payment.refunded";
  providerRef: string;
  bookingId: string;
}

export interface PaymentProvider {
  readonly name: string;
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  refund(providerRef: string, amountCents: number): Promise<RefundResult>;
  /** valida assinatura e interpreta o corpo do webhook do provedor */
  parseWebhook(rawBody: string, signature: string | null): Promise<WebhookEvent | null>;
  /** repasse ao motorista (após conclusão da viagem) */
  transferToDriver(driverAccountRef: string, amountCents: number): Promise<{ transferRef: string }>;
}
