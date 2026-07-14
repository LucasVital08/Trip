import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireBooking } from "@/lib/booking-service";

/** Expira reservas Pix abandonadas. Chame a cada 5 minutos pelo cron. */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const expired = await prisma.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      paymentExpiresAt: { lte: new Date() },
    },
    select: { id: true },
    take: 200,
  });
  await Promise.all(expired.map((booking) => expireBooking(booking.id, "Prazo de pagamento expirado")));
  return NextResponse.json({ expired: expired.length });
}
