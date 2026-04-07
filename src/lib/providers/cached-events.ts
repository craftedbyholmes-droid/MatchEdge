import { getEventsAcrossSupportedSports } from "@/lib/providers";
import { getCachedPayload, getRefreshSettings, isCacheFresh, setCachedPayload } from "@/lib/refresh-control";

const CACHE_KEY = "events_across_supported_sports_v1";

export async function getCachedEventsAcrossSupportedSports(args: { maxSports: number; maxEvents: number; forceRefresh?: boolean }) {
  const settings = await getRefreshSettings();
  const cached = await getCachedPayload<any[]>(CACHE_KEY);

  if (!args.forceRefresh) {
    if (settings.refreshMode === "manual" && cached.payload) {
      return {
        events: cached.payload,
        source: "cache",
        cachedAt: cached.fetchedAt,
        settings,
      };
    }

    if (settings.refreshMode === "hourly" && cached.payload && isCacheFresh(cached.fetchedAt, settings.refreshIntervalMinutes)) {
      return {
        events: cached.payload,
        source: "cache",
        cachedAt: cached.fetchedAt,
        settings,
      };
    }
  }

  const events = await getEventsAcrossSupportedSports({
    maxSports: args.maxSports,
    maxEvents: args.maxEvents,
  });

  await setCachedPayload(CACHE_KEY, events, "the_odds_api", "ok", "Events refreshed");

  return {
    events,
    source: "live",
    cachedAt: new Date().toISOString(),
    settings,
  };
}