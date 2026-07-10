/**
 * Interface do provedor de notificações transacionais.
 * Implementações: "console" (loga no servidor — dev) e, futuramente,
 * Resend/SendGrid (e-mail) + push/SMS.
 */
export interface NotificationPayload {
  to: { email: string; name: string; phone?: string | null };
  subject: string;
  body: string;
  /** categoria para roteamento/opt-out futuro */
  kind:
    | "booking.created"
    | "booking.confirmed"
    | "booking.cancelled"
    | "trip.reminder"
    | "trip.cancelled"
    | "payout.released"
    | "kyc.updated"
    | "message.received";
}

export interface NotificationProvider {
  readonly name: string;
  send(payload: NotificationPayload): Promise<void>;
}
