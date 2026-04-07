import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().default("MatchEdge"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().default("GBP"),
  NEXT_PUBLIC_DEFAULT_REGION: z.string().default("uk"),

  ODDS_PROVIDER_PRIMARY: z.string().default("the_odds_api"),
  ODDS_PROVIDER_SECONDARY: z.string().default("odds_api_io"),
  EXCHANGE_PROVIDER_PRIMARY: z.string().default("matchbook"),
  REAL_DATA_ONLY: z.string().default("true"),

  THE_ODDS_API_KEY: z.string().default(""),
  THE_ODDS_API_BASE_URL: z.string().default("https://api.the-odds-api.com/v4"),
  THE_ODDS_API_REGION: z.string().default("uk"),
  THE_ODDS_API_MARKETS: z.string().default("h2h"),
  THE_ODDS_API_ODDS_FORMAT: z.string().default("decimal"),
  THE_ODDS_API_DATE_FORMAT: z.string().default("iso"),

  ODDS_API_IO_KEY: z.string().default(""),
  ODDS_API_IO_BASE_URL: z.string().default("https://api.odds-api.io/v3"),
  ODDS_API_IO_REGION: z.string().default("uk"),
  ODDS_API_IO_MARKETS: z.string().default("h2h"),

  AFFILIATE_BET365_URL: z.string().default(""),
  AFFILIATE_WILLIAM_HILL_URL: z.string().default(""),
  AFFILIATE_BETFRED_URL: z.string().default(""),
  AFFILIATE_LADBROKES_URL: z.string().default(""),
  AFFILIATE_CORAL_URL: z.string().default(""),
  AFFILIATE_UNIBET_URL: z.string().default(""),
  AFFILIATE_MATCHBOOK_URL: z.string().default(""),
});

export const env = envSchema.parse(process.env);

export function requireValue(value: string, label: string) {
  if (!value || value.startsWith("REPLACE_WITH")) {
    throw new Error(`Missing required environment value: ${label}`);
  }
  return value;
}

export function isRealDataOnly() {
  return env.REAL_DATA_ONLY === "true";
}