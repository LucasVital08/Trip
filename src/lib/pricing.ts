import { PLATFORM } from "@/config/platform";

/**
 * Composição do preço de uma reserva.
 *
 * O motorista define livremente o preço por assento. A Trip soma a taxa de
 * serviço por cima, exibida de forma transparente no checkout:
 *
 *   subtotal (motorista)  = preço/assento × assentos
 *   taxa Trip             = subtotal × fee% + taxa fixa
 *   total (passageiro)    = subtotal + taxa Trip
 *
 * O repasse ao motorista é o subtotal integral — a taxa incide sobre o
 * passageiro, não desconta do valor anunciado pelo motorista.
 */
export interface PriceBreakdown {
  pricePerSeatCents: number;
  seats: number;
  subtotalCents: number;
  serviceFeeCents: number;
  totalCents: number;
  driverAmountCents: number;
}

export function computeBookingPrice(
  pricePerSeatCents: number,
  seats: number,
  feePercent: number = PLATFORM.feePercent,
  fixedFeeCents: number = PLATFORM.fixedFeeCents
): PriceBreakdown {
  if (!Number.isInteger(pricePerSeatCents) || pricePerSeatCents <= 0) {
    throw new Error("Preço por assento inválido");
  }
  if (!Number.isInteger(seats) || seats < 1) {
    throw new Error("Quantidade de assentos inválida");
  }
  const subtotalCents = pricePerSeatCents * seats;
  const serviceFeeCents = Math.round((subtotalCents * feePercent) / 100) + fixedFeeCents;
  const totalCents = subtotalCents + serviceFeeCents;
  return {
    pricePerSeatCents,
    seats,
    subtotalCents,
    serviceFeeCents,
    totalCents,
    driverAmountCents: subtotalCents,
  };
}

/**
 * Sugestão de faixa de preço por assento (REFERÊNCIA, nunca imposição).
 *
 * Base: rateio de custo estimado da viagem entre os assentos.
 *   custo ≈ km × (combustível R$/km) + pedágio estimado
 *   piso  = rateio puro (estilo BlaBlaCar)
 *   teto  = rateio × 2.2 (margem para experiências Conforto/Premium)
 */
export interface PriceSuggestion {
  lowCents: number;
  highCents: number;
  costShareCents: number;
}

const FUEL_COST_PER_KM_CENTS = 62; // ~R$0,62/km (consumo médio 12 km/L × R$7,40/L)
const TOLL_PER_100KM_CENTS = 350; // pedágio médio estimado no Brasil

export function suggestPricePerSeat(distanceKm: number, seatsTotal: number): PriceSuggestion {
  if (distanceKm <= 0 || seatsTotal < 1) {
    return { lowCents: PLATFORM.minPricePerSeatCents, highCents: PLATFORM.minPricePerSeatCents * 3, costShareCents: PLATFORM.minPricePerSeatCents };
  }
  const tripCostCents =
    distanceKm * FUEL_COST_PER_KM_CENTS +
    Math.round((distanceKm / 100) * TOLL_PER_100KM_CENTS);
  // rateio entre passageiros + motorista
  const costShareCents = Math.round(tripCostCents / (seatsTotal + 1));
  const round5 = (c: number) => Math.max(PLATFORM.minPricePerSeatCents, Math.round(c / 500) * 500);
  return {
    costShareCents,
    lowCents: round5(costShareCents),
    highCents: round5(costShareCents * 2.2),
  };
}

/**
 * Reembolso conforme política de cancelamento pelo passageiro.
 * Retorna o valor a reembolsar (centavos) sobre o total pago.
 */
export function computeRefundCents(
  totalCents: number,
  departAt: Date,
  cancelledAt: Date,
  policy = PLATFORM.cancellation
): number {
  const hoursUntil = (departAt.getTime() - cancelledAt.getTime()) / 3_600_000;
  if (hoursUntil >= policy.fullRefundHours) return totalCents;
  if (hoursUntil >= policy.partialRefundHours) {
    return Math.round((totalCents * policy.partialRefundPercent) / 100);
  }
  return 0;
}
