import { NextRequest, NextResponse } from "next/server";
import { getMapsProvider } from "@/providers/maps";

/** Autocomplete de cidades do catálogo. GET /api/cities?q=rec */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const cities = await getMapsProvider().searchCities(q, 8);
  return NextResponse.json({ cities });
}
