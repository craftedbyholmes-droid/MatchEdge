import { NextResponse } from "next/server";
import { getCachedEventsAcrossSupportedSports } from "@/lib/providers/cached-events";

export async function POST() {
  try {
    const result = await getCachedEventsAcrossSupportedSports({
      maxSports: 20,
      maxEvents: 200,
      forceRefresh: true,
    });

    return NextResponse.json({
      ok: true,
      source: result.source,
      cachedAt: result.cachedAt,
      count: result.events.length,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown force refresh error" },
      { status: 500 }
    );
  }
}