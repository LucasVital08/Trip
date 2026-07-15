import { NextRequest, NextResponse } from "next/server";
import { getMapsProvider } from "@/providers/maps";
import { getCurrentUser } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.driverProfile || user.driverProfile.status !== "VERIFIED") {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  if (!checkRateLimit(`places:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: "Muitas buscas. Aguarde um instante." }, { status: 429 });
  }

  const query = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 160);
  const sessionToken = (req.nextUrl.searchParams.get("session") ?? "").trim();
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));

  if (query.length < 3 || !isSessionToken(sessionToken)) {
    return NextResponse.json({ places: [] });
  }

  const bias = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
  const places = await getMapsProvider().searchPlaces(query, sessionToken, bias);
  return NextResponse.json(
    { places },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

function isSessionToken(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
