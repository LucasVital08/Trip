import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMapsProvider } from "@/providers/maps";
import { suggestPricePerSeat } from "@/lib/pricing";

/**
 * Sugestão de faixa de preço para o formulário de publicação.
 * GET /api/price-suggestion?origem=recife&destino=caruaru&assentos=3
 * A sugestão é referência — o motorista define o valor final.
 */
export async function GET(req: NextRequest) {
  const origem = req.nextUrl.searchParams.get("origem") ?? "";
  const destino = req.nextUrl.searchParams.get("destino") ?? "";
  const seats = Number(req.nextUrl.searchParams.get("assentos") ?? 3);

  const [origin, dest] = await Promise.all([
    prisma.city.findUnique({ where: { slug: origem } }),
    prisma.city.findUnique({ where: { slug: destino } }),
  ]);
  if (!origin || !dest) {
    return NextResponse.json({ error: "cidade não encontrada" }, { status: 404 });
  }

  const route = await getMapsProvider().estimateRoute(
    { lat: origin.lat, lng: origin.lng },
    { lat: dest.lat, lng: dest.lng }
  );
  const suggestion = suggestPricePerSeat(route.distanceKm, Math.max(1, Math.min(7, seats)));

  return NextResponse.json({
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    suggestion,
  });
}
