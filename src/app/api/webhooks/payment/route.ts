import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/providers/payments";
import { confirmBooking } from "@/lib/booking-service";

/**
 * Webhook de confirmação de pagamento — o caminho canônico para Pix e
 * qualquer confirmação assíncrona. O provedor valida a assinatura antes
 * de interpretarmos o evento (nunca confie no corpo cru).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-webhook-signature") ?? req.headers.get("stripe-signature");

  const event = await getPaymentProvider().parseWebhook(rawBody, signature);
  if (!event) {
    return NextResponse.json({ error: "assinatura ou payload inválidos" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { providerRef: event.providerRef, bookingId: event.bookingId },
    include: { booking: true },
  });
  if (!payment) {
    return NextResponse.json({ error: "pagamento não encontrado" }, { status: 404 });
  }

  switch (event.type) {
    case "payment.paid": {
      if (payment.status !== "PAID") {
        // Um Pix pode ser liquidado depois que a reserva pendente foi
        // cancelada/expirada. Nesse caso o valor nunca deve ficar órfão.
        if (payment.booking.status !== "PENDING_PAYMENT") {
          if (payment.providerRef) {
            await getPaymentProvider().refund(payment.providerRef, payment.amountCents);
          }
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "REFUNDED",
              paidAt: payment.paidAt ?? new Date(),
              refundedAt: new Date(),
              refundCents: payment.amountCents,
            },
          });
          break;
        }
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "PAID", paidAt: new Date() },
        });
        await confirmBooking(payment.bookingId);
        const settled = await prisma.payment.findUnique({
          where: { id: payment.id },
          include: { booking: true },
        });
        if (settled?.status === "PAID" && settled.booking.status !== "CONFIRMED") {
          if (settled.providerRef) {
            await getPaymentProvider().refund(settled.providerRef, settled.amountCents);
          }
          await prisma.payment.updateMany({
            where: { id: settled.id, status: "PAID" },
            data: {
              status: "REFUNDED",
              refundedAt: new Date(),
              refundCents: settled.amountCents,
            },
          });
        }
      }
      break;
    }
    case "payment.failed": {
      if (payment.status === "PENDING" && payment.booking.status === "PENDING_PAYMENT") {
        await prisma.$transaction(async (tx) => {
          const expired = await tx.booking.updateMany({
            where: { id: payment.bookingId, status: "PENDING_PAYMENT" },
            data: {
              status: "EXPIRED",
              cancelledAt: new Date(),
              cancelReason: "Pagamento falhou",
              activeKey: null,
              shareRevokedAt: new Date(),
            },
          });
          if (expired.count === 0) return;
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED", failReason: "Pagamento falhou no provedor" },
          });
          await tx.trip.update({
            where: { id: payment.booking.tripId },
            data: { seatsAvailable: { increment: payment.booking.seats } },
          });
        });
      }
      break;
    }
    case "payment.refunded": {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
