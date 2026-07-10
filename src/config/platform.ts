/**
 * Regras econômicas da plataforma.
 *
 * A Trip é intermediadora: cobra uma taxa de serviço sobre cada reserva,
 * retém o pagamento (escrow) e repassa ao motorista após a viagem.
 * Ganchos para monetização futura estão declarados aqui (fixedFeeCents,
 * premium driver, etc.) — ver DECISIONS.md.
 */
export const PLATFORM = {
  /** Taxa de serviço (%) sobre o subtotal do motorista. Parametrizável por env. */
  feePercent: Number(process.env.PLATFORM_FEE_PERCENT ?? 12),

  /** Gancho: taxa fixa por reserva (centavos), somada ao percentual. Hoje 0. */
  fixedFeeCents: 0,

  /** Gancho: taxa reduzida para motoristas assinantes premium (futuro). */
  premiumDriverFeePercent: 8,

  /** Janela de expiração de reservas aguardando pagamento (minutos). */
  paymentExpiresMinutes: 30,

  /** Política de cancelamento pelo passageiro (reembolso conforme antecedência). */
  cancellation: {
    /** ≥ 24h antes da saída: reembolso integral. */
    fullRefundHours: 24,
    /** entre 24h e 3h antes: reembolso de 50%. */
    partialRefundHours: 3,
    partialRefundPercent: 50,
    /** < 3h: sem reembolso (repasse integral ao motorista). */
  },

  /** Assentos máximos por reserva. */
  maxSeatsPerBooking: 4,

  /** Preço mínimo por assento (centavos) — evita anúncios simbólicos/spam. */
  minPricePerSeatCents: 1000,
  /** Preço máximo por assento (centavos). */
  maxPricePerSeatCents: 100_000,
} as const;
