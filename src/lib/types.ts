export type OpportunityKind = "qualifying" | "surebet" | "guaranteed_profit" | "offer_cycle";

export type OutcomePrice = {
  outcome: string;
  bookmaker: string;
  odds: number;
  deepLink?: string;
  bookmakerKey?: string;
};

export type NormalizedEvent = {
  id: string;
  sport: string;
  sportTitle?: string;
  marketKey?: string;
  marketLabel?: string;
  name: string;
  commenceTime: string;
  homeTeam?: string;
  awayTeam?: string;
  outcomes: OutcomePrice[];
};

export type Opportunity = {
  id: string;
  eventName: string;
  sport: string;
  marketLabel?: string;
  kind: OpportunityKind;
  impliedProbability: number;
  marginPercent: number;
  expectedProfitPercent: number;
  qualifyingLossPercent?: number;
  stakePlan: Array<{
    outcome: string;
    bookmaker: string;
    bookmakerKey?: string;
    odds: number;
    stake: number;
    deepLink?: string;
  }>;
  notes: string[];
};

export type SupportedSport = {
  key: string;
  title: string;
  active: boolean;
  hasOutrights: boolean;
};