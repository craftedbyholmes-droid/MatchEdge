"use client";

import { useMemo, useState } from "react";
import { formatOddsBoth } from "@/lib/odds-format";
import { logExecution } from "@/lib/execution";

type Mode = "profit" | "welcome" | "hybrid";

type Opportunity = {
  id: string;
  eventName: string;
  sport: string;
  marketLabel?: string;
  kind: "qualifying" | "surebet" | "guaranteed_profit" | "offer_cycle";
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

function isWelcomeOpportunity(opportunity: Opportunity) {
  return opportunity.kind === "qualifying" || opportunity.kind === "offer_cycle";
}

export function CompareClient({
  opportunities,
  usedOfferBookmakers,
}: {
  opportunities: Opportunity[];
  usedOfferBookmakers: string[];
}) {
  const [mode, setMode] = useState<Mode>("hybrid");
  const [status, setStatus] = useState<Record<string, string>>({});
  const used = useMemo(
    () => new Set(usedOfferBookmakers.map((x) => String(x || "").toLowerCase())),
    [usedOfferBookmakers]
  );

  async function handleLog(opportunity: Opportunity) {
    try {
      setStatus((prev) => ({ ...prev, [opportunity.id]: "Logging execution..." }));

      await logExecution({
        opportunityId: opportunity.id,
        eventName: opportunity.eventName,
        kind: opportunity.kind,
        sourcePage: "compare",
        notes: opportunity.notes,
        legs: opportunity.stakePlan.map((leg) => ({
          bookmaker: leg.bookmaker,
          bookmakerKey: leg.bookmakerKey,
          stake: leg.stake,
          odds: leg.odds,
        })),
      });

      setStatus((prev) => ({ ...prev, [opportunity.id]: "Execution logged." }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        [opportunity.id]: error instanceof Error ? error.message : "Failed to log execution.",
      }));
    }
  }

  const rows = useMemo(() => {
    return opportunities
      .filter((opportunity) => {
        const isWelcome = isWelcomeOpportunity(opportunity);
        if (mode === "profit") return !isWelcome;
        if (mode === "welcome") return isWelcome;
        return true;
      })
      .filter((opportunity) => {
        const isWelcome = isWelcomeOpportunity(opportunity);
        if (!isWelcome) return true;

        const keys = opportunity.stakePlan
          .map((leg) => String(leg.bookmakerKey || "").toLowerCase())
          .filter(Boolean);

        if (!keys.length) return true;
        return !keys.every((key) => used.has(key));
      })
      .sort((a, b) => {
        const aIsWelcome = isWelcomeOpportunity(a);
        const bIsWelcome = isWelcomeOpportunity(b);

        if (aIsWelcome !== bIsWelcome) {
          return aIsWelcome ? 1 : -1;
        }

        const aScore = aIsWelcome ? -(a.qualifyingLossPercent || 0) : a.expectedProfitPercent;
        const bScore = bIsWelcome ? -(b.qualifyingLossPercent || 0) : b.expectedProfitPercent;
        return bScore - aScore;
      });
  }, [mode, opportunities, used]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {(["profit", "welcome", "hybrid"] as Mode[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-2xl px-4 py-3 text-sm capitalize ${
              mode === value
                ? "bg-emerald-500 text-slate-950"
                : "border border-white/10 bg-slate-950 text-white"
            }`}
          >
            {value === "welcome" ? "Welcome Offers" : value === "profit" ? "Profit Bets" : "Hybrid"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {rows.map((opportunity) => {
          const isWelcome = isWelcomeOpportunity(opportunity);

          return (
            <div key={opportunity.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                {opportunity.sport}
                {opportunity.marketLabel ? ` • ${opportunity.marketLabel}` : ""} • {isWelcome ? "Welcome Offer" : "Profit Bet"}
              </div>

              <div className="mt-2 text-xl font-semibold">{opportunity.eventName}</div>

              <div className="mt-3 text-sm text-slate-400">
                {opportunity.notes.join(" • ")}
              </div>

              <div className="mt-4 grid gap-3">
                {opportunity.stakePlan.map((leg, idx) => (
                  <div key={`${opportunity.id}-${idx}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{leg.outcome}</span> • {leg.bookmaker} • Odds {formatOddsBoth(leg.odds)} • Stake £{leg.stake.toFixed(2)}
                      </div>

                      <a
                        href={leg.deepLink || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200"
                      >
                        Open {leg.bookmaker}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="text-sm">
                  {isWelcome ? (
                    <span className="text-amber-200">
                      Controlled qualifying loss: {Number(opportunity.qualifyingLossPercent || 0).toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-emerald-200">
                      Expected profit: {opportunity.expectedProfitPercent.toFixed(2)}%
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleLog(opportunity)}
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
                >
                  Log execution
                </button>
              </div>

              {status[opportunity.id] ? (
                <div className="mt-3 text-sm text-slate-400">{status[opportunity.id]}</div>
              ) : null}
            </div>
          );
        })}

        {!rows.length ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-400">
            No opportunities match the current selection right now.
          </div>
        ) : null}
      </div>
    </div>
  );
}