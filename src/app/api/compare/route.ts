import { NextResponse } from "next/server";
import { getEventsAcrossSupportedSports } from "@/lib/providers";
import { attachDeepLinks, buildSurebetOpportunity } from "@/lib/services/calculations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bankroll = Number(searchParams.get("bankroll") || 100);
  const maxSports = Number(searchParams.get("maxSports") || 20);
  const maxEvents = Number(searchParams.get("maxEvents") || 200);

  try {
    const events = (await getEventsAcrossSupportedSports({ maxSports, maxEvents })).map(attachDeepLinks);
    const items = events.map((event) => buildSurebetOpportunity(event, bankroll)).filter(Boolean);
    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown compare error",
      },
      { status: 503 }
    );
  }
}