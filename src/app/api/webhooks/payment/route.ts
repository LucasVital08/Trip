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
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "PAID", paidAt: new Date() },
        });
        await confirmBooking(payment.bookingId);
      }
      break;
    }
    case "payment.failed": {
      if (payment.status === "PENDING") {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED", failReason: "Pagamento falhou no provedor" },
          }),
          prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: "EXPIRED", cancelledAt: new Date(), cancelReason: "Pagamento falhou" },
          }),
          prisma.trip.update({
            where: { id: payment.booking.tripId },
            data: { seatsAvailable: { increment: payment.booking.seats } },
          }),
        ]);
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
