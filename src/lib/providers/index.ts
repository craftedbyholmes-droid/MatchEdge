import { env } from "@/lib/env";
import { NormalizedEvent, SupportedSport } from "@/lib/types";
import {
  fetchEventsForSportFromOddsApiIo,
  fetchSupportedSportsFromOddsApiIo,
} from "@/lib/providers/oddsApiIo";
import {
  fetchEventsForSportFromTheOddsApi,
  fetchSupportedSportsFromTheOddsApi,
} from "@/lib/providers/theOddsApi";

function isUsableSport(sport: SupportedSport) {
  return sport.active && !sport.hasOutrights;
}

async function fetchSupportedSportsPrimary(): Promise<SupportedSport[]> {
  if (env.ODDS_PROVIDER_PRIMARY === "the_odds_api") {
    return fetchSupportedSportsFromTheOddsApi();
  }

  if (env.ODDS_PROVIDER_PRIMARY === "odds_api_io") {
    return fetchSupportedSportsFromOddsApiIo();
  }

  throw new Error(`Unsupported primary provider: ${env.ODDS_PROVIDER_PRIMARY}`);
}

async function fetchEventsForSportPrimary(sportKey: string): Promise<NormalizedEvent[]> {
  if (env.ODDS_PROVIDER_PRIMARY === "the_odds_api") {
    return fetchEventsForSportFromTheOddsApi(sportKey);
  }

  if (env.ODDS_PROVIDER_PRIMARY === "odds_api_io") {
    return fetchEventsForSportFromOddsApiIo(sportKey);
  }

  throw new Error(`Unsupported primary provider: ${env.ODDS_PROVIDER_PRIMARY}`);
}

export async function getSupportedSports(): Promise<SupportedSport[]> {
  const sports = await fetchSupportedSportsPrimary();
  return sports.filter(isUsableSport);
}

export async function getEventsAcrossSupportedSports(options?: {
  maxSports?: number;
  maxEvents?: number;
}) {
  const maxSports = options?.maxSports ?? 12;
  const maxEvents = options?.maxEvents ?? 120;

  const sports = await getSupportedSports();
  const selectedSports = sports.slice(0, maxSports);

  const eventResults = await Promise.all(
    selectedSports.map(async (sport) => {
      try {
        return await fetchEventsForSportPrimary(sport.key);
      } catch {
        return [];
      }
    })
  );

  return eventResults.flat().filter((event) => event.outcomes.length >= 2).slice(0, maxEvents);
}