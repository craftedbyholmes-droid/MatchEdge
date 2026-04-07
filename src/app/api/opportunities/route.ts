import { NextResponse } from "next/server";
import { getEventsAcrossSupportedSports } from "@/lib/providers";
import { attachDeepLinks, buildQualifyingOpportunity, buildSurebetOpportunity } from "@/lib/services/calculations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bankroll = Number(searchParams.get("bankroll") || 100);
  const profitOnly = searchParams.get("profitOnly") === "true";
  const maxSports = Number(searchParams.get("maxSports") || 12);
  const maxEvents = Number(searchParams.get("maxEvents") || 120);

  try {
    const events = (await getEventsAcrossSupportedSports({ maxSports, maxEvents })).map(attachDeepLinks);

    let items = events.flatMap((event) => [
      buildSurebetOpportunity(event, bankroll),
      buildQualifyingOpportunity(event),
    ].filter(Boolean));

    if (profitOnly) {
      items = items.filter((item: any) => item.kind !== "qualifying");
    }

    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown opportunities error",
      },
      { status: 503 }
    );
  }
}