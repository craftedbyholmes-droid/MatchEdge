import { NormalizedEvent, Opportunity, OutcomePrice } from "@/lib/types";

function round(n: number, dp = 2) {
  return Number(n.toFixed(dp));
}

export function normalizeBookmakerName(bookmaker: string) {
  return String(bookmaker || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

export function displayBookmakerName(bookmaker: string) {
  const key = normalizeBookmakerName(bookmaker);

  const labels: Record<string, string> = {
    bet365: "Bet365",
    williamhill: "William Hill",
    betfred: "Betfred",
    ladbrokes: "Ladbrokes",
    coral: "Coral",
    unibet: "Unibet",
    matchbook: "Matchbook",
    skybet: "Sky Bet",
    paddypower: "Paddy Power",
    virginbet: "Virgin Bet",
    leovegas: "LeoVegas",
    livescorebet: "LiveScore Bet",
    smarkets: "Smarkets",
    betconnect: "BetConnect",
    betfair_ex_uk: "Betfair Exchange UK",
    betfair: "Betfair",
    casumo: "Casumo",
  };

  return labels[key] || bookmaker || "Bookmaker";
}

export function affiliateLinkForBookmaker(bookmaker: string) {
  const key = normalizeBookmakerName(bookmaker);

  const map: Record<string, string | undefined> = {
    bet365: process.env.AFFILIATE_BET365_URL,
    williamhill: process.env.AFFILIATE_WILLIAM_HILL_URL,
    betfred: process.env.AFFILIATE_BETFRED_URL,
    ladbrokes: process.env.AFFILIATE_LADBROKES_URL,
    coral: process.env.AFFILIATE_CORAL_URL,
    unibet: process.env.AFFILIATE_UNIBET_URL,
    matchbook: process.env.AFFILIATE_MATCHBOOK_URL,
    leovegas: process.env.AFFILIATE_LEOVEGAS_URL,
    skybet: process.env.AFFILIATE_SKYBET_URL,
    paddypower: process.env.AFFILIATE_PADDY_POWER_URL,
    virginbet: process.env.AFFILIATE_VIRGIN_BET_URL,
    livescorebet: process.env.AFFILIATE_LIVESCORE_BET_URL,
    smarkets: process.env.AFFILIATE_SMARKETS_URL,
    betconnect: process.env.AFFILIATE_BETCONNECT_URL,
    betfair_ex_uk: "https://www.betfair.com/exchange/plus/",
    betfair: "https://www.betfair.com/exchange/plus/",
    casumo: "https://www.casumo.com",
  };

  const value = map[key];

  if (!value || value === "#" || value.startsWith("https://example.com/affiliate/")) {
    return "";
  }

  return value;
}

export function attachDeepLinks(event: NormalizedEvent): NormalizedEvent {
  return {
    ...event,
    outcomes: event.outcomes.map((x) => {
      const bookmakerKey = normalizeBookmakerName(x.bookmaker);
      const affiliateUrl = affiliateLinkForBookmaker(x.bookmaker);
      const providerUrl = x.deepLink && x.deepLink !== "#" ? x.deepLink : "";
      const usableUrl = affiliateUrl || providerUrl || "";

      return {
        ...x,
        bookmaker: displayBookmakerName(x.bookmaker),
        bookmakerKey,
        deepLink: usableUrl,
      };
    }),
  };
}

export function pickBestByOutcome(outcomes: OutcomePrice[]) {
  const grouped = new Map<string, OutcomePrice[]>();

  for (const outcome of outcomes) {
    const label = String(outcome.outcome || "").trim();
    if (!label) continue;

    if (!grouped.has(label)) {
      grouped.set(label, []);
    }

    grouped.get(label)!.push(outcome);
  }

  return Array.from(grouped.values())
    .map((items) => items.sort((a, b) => b.odds - a.odds)[0])
    .filter((item) => Number.isFinite(item.odds) && item.odds > 1);
}

export function calculateImpliedProbability(bestByOutcome: OutcomePrice[]) {
  return bestByOutcome.reduce((sum, item) => sum + 1 / item.odds, 0);
}

export function isCompleteOutcomeSet(bestByOutcome: OutcomePrice[]) {
  return bestByOutcome.length >= 2;
}

export function buildSurebetOpportunity(event: NormalizedEvent, bankroll = 100): Opportunity | null {
  const best = pickBestByOutcome(event.outcomes);
  if (!isCompleteOutcomeSet(best)) return null;

  const impliedProbability = calculateImpliedProbability(best);
  if (impliedProbability >= 1) return null;

  const targetReturn = bankroll / impliedProbability;
  const profit = targetReturn - bankroll;

  return {
    id: `${event.id}-${event.marketKey || "market"}-surebet`,
    eventName: event.name,
    sport: event.sportTitle || event.sport,
    marketLabel: event.marketLabel,
    kind: "surebet",
    impliedProbability: round(impliedProbability, 4),
    marginPercent: round((1 - impliedProbability) * 100, 2),
    expectedProfitPercent: round((profit / bankroll) * 100, 2),
    stakePlan: best.map((item) => ({
      outcome: item.outcome,
      bookmaker: item.bookmaker,
      bookmakerKey: item.bookmakerKey,
      odds: item.odds,
      stake: round(targetReturn / item.odds, 2),
      deepLink: item.deepLink,
    })),
    notes: [
      `Outcome-count agnostic market coverage: ${best.length} outcomes.`,
      "No-loss setup if all final outcomes are fully covered at the stated prices.",
      "Re-check every price immediately before placing all legs.",
    ],
  };
}

export function buildQualifyingOpportunity(event: NormalizedEvent, qualifyingStake = 50): Opportunity | null {
  const best = pickBestByOutcome(event.outcomes);
  if (!isCompleteOutcomeSet(best)) return null;

  const impliedProbability = calculateImpliedProbability(best);
  const qualifyingLossPercent = Math.max(0, (impliedProbability - 1) * 100);

  return {
    id: `${event.id}-${event.marketKey || "market"}-qualifying`,
    eventName: event.name,
    sport: event.sportTitle || event.sport,
    marketLabel: event.marketLabel,
    kind: "qualifying",
    impliedProbability: round(impliedProbability, 4),
    marginPercent: round((1 - impliedProbability) * 100, 2),
    expectedProfitPercent: 0,
    qualifyingLossPercent: round(qualifyingLossPercent, 2),
    stakePlan: best.map((item) => ({
      outcome: item.outcome,
      bookmaker: item.bookmaker,
      bookmakerKey: item.bookmakerKey,
      odds: item.odds,
      stake: round(qualifyingStake / best.length, 2),
      deepLink: item.deepLink,
    })),
    notes: [
      `Outcome-count agnostic market coverage: ${best.length} outcomes.`,
      "Useful when all outcomes are covered but the total still sits above 100%.",
      "Hide these in Profit Only mode.",
    ],
  };
}