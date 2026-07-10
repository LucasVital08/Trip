import type { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock";
import { StripePaymentProvider } from "./stripe";

let instance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;
  const which = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (which) {
    case "stripe":
      instance = new StripePaymentProvider();
      break;
    case "mock":
    default:
      instance = new MockPaymentProvider();
  }
  return instance;
}

export type { PaymentProvider } from "./types";
