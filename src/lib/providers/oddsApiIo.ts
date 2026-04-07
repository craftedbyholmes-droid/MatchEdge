import { env, requireValue } from "@/lib/env";
import { NormalizedEvent, SupportedSport } from "@/lib/types";

export async function fetchSupportedSportsFromOddsApiIo(): Promise<SupportedSport[]> {
  const apiKey = requireValue(env.ODDS_API_IO_KEY, "ODDS_API_IO_KEY");

  const url = new URL(`${env.ODDS_API_IO_BASE_URL}/sports`);
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Odds-API.io sports discovery failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

  return rows.map((row: any) => ({
    key: String(row.key || row.slug || row.id || row.name),
    title: String(row.title || row.name || row.key || "Unknown"),
    active: true,
    hasOutrights: false,
  }));
}

export async function fetchEventsForSportFromOddsApiIo(sportKey: string): Promise<NormalizedEvent[]> {
  const apiKey = requireValue(env.ODDS_API_IO_KEY, "ODDS_API_IO_KEY");

  const eventsUrl = new URL(`${env.ODDS_API_IO_BASE_URL}/events`);
  eventsUrl.searchParams.set("apiKey", apiKey);
  eventsUrl.searchParams.set("sport", sportKey);

  const eventsRes = await fetch(eventsUrl.toString(), { cache: "no-store" });
  if (!eventsRes.ok) {
    throw new Error(`Odds-API.io event fetch failed for ${sportKey}: ${eventsRes.status} ${await eventsRes.text()}`);
  }

  const eventsJson = await eventsRes.json();
  const events = Array.isArray(eventsJson?.data) ? eventsJson.data : Array.isArray(eventsJson) ? eventsJson : [];
  const normalized: NormalizedEvent[] = [];

  for (const event of events.slice(0, 20)) {
    const oddsUrl = new URL(`${env.ODDS_API_IO_BASE_URL}/odds`);
    oddsUrl.searchParams.set("apiKey", apiKey);
    oddsUrl.searchParams.set("eventId", String(event.id));

    const oddsRes = await fetch(oddsUrl.toString(), { cache: "no-store" });
    if (!oddsRes.ok) {
      throw new Error(`Odds-API.io odds failed for event ${event.id}: ${oddsRes.status} ${await oddsRes.text()}`);
    }

    const oddsJson = await oddsRes.json();
    const bookmakers = Array.isArray(oddsJson?.data?.bookmakers)
      ? oddsJson.data.bookmakers
      : Array.isArray(oddsJson?.bookmakers)
      ? oddsJson.bookmakers
      : [];

    const outcomes = bookmakers.flatMap((bookmaker: any) =>
      (bookmaker.markets || [])
        .filter((market: any) => String(market.key || market.name || "").toLowerCase().includes("h2h"))
        .flatMap((market: any) =>
          (market.outcomes || []).map((outcome: any) => ({
            outcome: outcome.name || outcome.label || "Unknown",
            bookmaker: bookmaker.key || bookmaker.name || "unknown",
            odds: Number(outcome.price || outcome.odds),
            deepLink: bookmaker.link,
          }))
        )
    );

    normalized.push({
      id: String(event.id),
      sport: String(sportKey),
      sportTitle: String(event.sport || sportKey),
      marketKey: "h2h",
      marketLabel: "H2H",
      name: String(event.name || `${event.home_team} vs ${event.away_team}`),
      commenceTime: String(event.start_time || event.commence_time || new Date().toISOString()),
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      outcomes,
    });
  }

  return normalized;
}