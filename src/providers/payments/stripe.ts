import type {
  ChargeResult,
  CreateChargeInput,
  PaymentProvider,
  RefundResult,
  WebhookEvent,
} from "./types";

/**
 * Esqueleto da integração Stripe Connect (destination charges).
 *
 * Fluxo pretendido (ver DECISIONS.md):
 *  - motorista onboarda numa conta Connect Express (driverAccountRef);
 *  - cada reserva vira um PaymentIntent com `transfer_data.destination`
 *    apontando para a conta do motorista e `application_fee_amount` = taxa Trip;
 *  - Pix habilitado como payment method (disponível para contas BR);
 *  - webhook `payment_intent.succeeded` confirma a reserva;
 *  - repasse fica retido via `transfer_data` + payout schedule manual,
 *    liberado após a conclusão da viagem.
 *
 * Ativação: PAYMENT_PROVIDER=stripe + STRIPE_SECRET_KEY. Enquanto as chaves
 * não existirem, o construtor lança erro claro — em dev use "mock".
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "PAYMENT_PROVIDER=stripe requer STRIPE_SECRET_KEY. Em desenvolvimento use PAYMENT_PROVIDER=mock."
      );
    }
  }

  async createCharge(_input: CreateChargeInput): Promise<ChargeResult> {
    throw new Error("Integração Stripe pendente de credenciais — implementar com o SDK oficial (stripe-node).");
  }

  async refund(_providerRef: string, _amountCents: number): Promise<RefundResult> {
    throw new Error("Integração Stripe pendente de credenciais.");
  }

  async parseWebhook(_rawBody: string, _signature: string | null): Promise<WebhookEvent | null> {
    throw new Error("Integração Stripe pendente de credenciais.");
  }

  async transferToDriver(_driverAccountRef: string, _amountCents: number): Promise<{ transferRef: string }> {
    throw new Error("Integração Stripe pendente de credenciais.");
  }
}
