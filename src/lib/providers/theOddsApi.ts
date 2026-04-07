import { env, requireValue } from "@/lib/env";
import { NormalizedEvent, SupportedSport } from "@/lib/types";

type TheOddsSport = {
  key: string;
  title: string;
  active: boolean;
  has_outrights: boolean;
};

export async function fetchSupportedSportsFromTheOddsApi(): Promise<SupportedSport[]> {
  const apiKey = requireValue(env.THE_ODDS_API_KEY, "THE_ODDS_API_KEY");

  const url = new URL(`${env.THE_ODDS_API_BASE_URL}/sports`);
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`The Odds API sports discovery failed: ${res.status} ${await res.text()}`);
  }

  const json: TheOddsSport[] = await res.json();

  return (json || []).map((sport) => ({
    key: sport.key,
    title: sport.title,
    active: Boolean(sport.active),
    hasOutrights: Boolean(sport.has_outrights),
  }));
}

export async function fetchEventsForSportFromTheOddsApi(sportKey: string): Promise<NormalizedEvent[]> {
  const apiKey = requireValue(env.THE_ODDS_API_KEY, "THE_ODDS_API_KEY");

  const url = new URL(`${env.THE_ODDS_API_BASE_URL}/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", env.THE_ODDS_API_REGION);
  url.searchParams.set("markets", env.THE_ODDS_API_MARKETS);
  url.searchParams.set("oddsFormat", env.THE_ODDS_API_ODDS_FORMAT);
  url.searchParams.set("dateFormat", env.THE_ODDS_API_DATE_FORMAT);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`The Odds API sport fetch failed for ${sportKey}: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();

  return (json || []).map((event: any) => {
    const bookmakerMarkets =
      event.bookmakers?.flatMap((bookmaker: any) =>
        bookmaker.markets?.map((market: any) => ({
          bookmakerKey: bookmaker.key || bookmaker.title || "unknown",
          bookmakerLink: bookmaker.link,
          marketKey: market.key,
          outcomes: market.outcomes || [],
        })) || []
      ) || [];

    const targetMarketKey = String(env.THE_ODDS_API_MARKETS || "h2h");
    const targetMarketRows = bookmakerMarkets.filter((row: any) => row.marketKey === targetMarketKey);

    const outcomes = targetMarketRows.flatMap((row: any) =>
      row.outcomes.map((outcome: any) => ({
        outcome: outcome.name,
        bookmaker: row.bookmakerKey,
        odds: Number(outcome.price),
        deepLink: row.bookmakerLink,
      }))
    );

    return {
      id: String(event.id),
      sport: String(event.sport_key),
      sportTitle: String(event.sport_title || event.sport_key),
      marketKey: targetMarketKey,
      marketLabel: targetMarketKey.toUpperCase(),
      name: `${event.home_team} vs ${event.away_team}`,
      commenceTime: String(event.commence_time),
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      outcomes,
    } satisfies NormalizedEvent;
  });
}