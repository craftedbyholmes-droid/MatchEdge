"use client";

import { useMemo, useState } from "react";
import { formatOddsBoth } from "@/lib/odds-format";
import { logExecution } from "@/lib/execution";

type BankrollMode = "per_bet" | "across_plan";

type Opportunity = {
  id: string;
  eventName: string;
  sport: string;
  marketLabel?: string;
  expectedProfitPercent: number;
  kind?: string;
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

type RowState = {
  excluded: boolean;
  completed: boolean;
  clickedLegs: boolean[];
  executionLogged: boolean;
};

function computeSelection(opportunity: Opportunity, outlay: number) {
  const original = opportunity.stakePlan.reduce((sum, leg) => sum + leg.stake, 0) || 1;
  const scale = outlay / original;

  const legs = opportunity.stakePlan.map((leg) => ({
    ...leg,
    adjustedStake: Number((leg.stake * scale).toFixed(2)),
  }));

  const returns = legs.map((leg) => leg.adjustedStake * leg.odds);
  const minReturn = Math.min(...returns);
  const maxReturn = Math.max(...returns);

  return {
    legs,
    minProfit: Number((minReturn - outlay).toFixed(2)),
    maxProfit: Number((maxReturn - outlay).toFixed(2)),
  };
}

export function ProfitOnlyPlanClient({
  opportunities,
  defaultBankroll,
}: {
  opportunities: Opportunity[];
  defaultBankroll: number;
}) {
  const [bankroll, setBankroll] = useState(Math.max(1, Number(defaultBankroll || 100)));
  const [bankrollMode, setBankrollMode] = useState<BankrollMode>("per_bet");
  const [status, setStatus] = useState<Record<string, string>>({});
  const [states, setStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      opportunities.map((opportunity) => [
        opportunity.id,
        {
          excluded: false,
          completed: false,
          clickedLegs: opportunity.stakePlan.map(() => false),
          executionLogged: false,
        },
      ])
    )
  );

  const activeIds = useMemo(() => {
    return opportunities
      .map((opportunity) => opportunity.id)
      .filter((id) => !states[id]?.excluded);
  }, [opportunities, states]);

  const activeCount = Math.max(1, activeIds.length);

  const rows = useMemo(() => {
    return opportunities
      .map((opportunity) => {
        const state = states[opportunity.id];
        const outlay =
          bankrollMode === "per_bet"
            ? bankroll
            : Number((bankroll / activeCount).toFixed(2));

        const metrics = computeSelection(opportunity, outlay);

        return {
          opportunity,
          state,
          outlay,
          metrics,
        };
      })
      .sort((a, b) => b.metrics.maxProfit - a.metrics.maxProfit);
  }, [opportunities, states, bankroll, bankrollMode, activeCount]);

  const summary = useMemo(() => {
    const activeRows = rows.filter((row) => !row.state.excluded);
    const totalCommitted = activeRows.reduce((sum, row) => sum + row.outlay, 0);
    const minProfit = Number(activeRows.reduce((sum, row) => sum + row.metrics.minProfit, 0).toFixed(2));
    const maxProfit = Number(activeRows.reduce((sum, row) => sum + row.metrics.maxProfit, 0).toFixed(2));
    const minPct = totalCommitted > 0 ? Number(((minProfit / totalCommitted) * 100).toFixed(2)) : 0;
    const maxPct = totalCommitted > 0 ? Number(((maxProfit / totalCommitted) * 100).toFixed(2)) : 0;

    return {
      activeCount: activeRows.length,
      totalCommitted: Number(totalCommitted.toFixed(2)),
      minProfit,
      maxProfit,
      minPct,
      maxPct,
    };
  }, [rows]);

  function patch(id: string, next: Partial<RowState>) {
    setStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...next,
      },
    }));
  }

  async function maybeLogExecution(opportunity: Opportunity, legs: Array<{ bookmaker: string; bookmakerKey?: string; adjustedStake: number; odds: number }>) {
    const state = states[opportunity.id];
    if (state?.executionLogged) {
      return;
    }

    try {
      setStatus((prev) => ({ ...prev, [opportunity.id]: "Logging execution..." }));

      await logExecution({
        opportunityId: opportunity.id,
        eventName: opportunity.eventName,
        kind: opportunity.kind || "surebet",
        sourcePage: "plan",
        notes: opportunity.notes,
        legs: legs.map((leg) => ({
          bookmaker: leg.bookmaker,
          bookmakerKey: leg.bookmakerKey,
          stake: leg.adjustedStake,
          odds: leg.odds,
        })),
      });

      setStates((prev) => ({
        ...prev,
        [opportunity.id]: {
          ...prev[opportunity.id],
          executionLogged: true,
        },
      }));

      setStatus((prev) => ({ ...prev, [opportunity.id]: "Execution logged." }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        [opportunity.id]: error instanceof Error ? error.message : "Failed to log execution.",
      }));
    }
  }

  async function clickLeg(
    opportunity: Opportunity,
    allLegs: Array<{ bookmaker: string; bookmakerKey?: string; adjustedStake: number; odds: number; deepLink?: string }>,
    legIndex: number,
    url?: string
  ) {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    const current = states[opportunity.id];
    const clickedLegs = [...current.clickedLegs];
    clickedLegs[legIndex] = true;

    const completed = clickedLegs.every(Boolean);

    setStates((prev) => ({
      ...prev,
      [opportunity.id]: {
        ...prev[opportunity.id],
        clickedLegs,
        completed,
      },
    }));

    await maybeLogExecution(opportunity, allLegs);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Bankroll Intelligence</div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
                Default bankroll from settings
              </label>
              <input
                type="number"
                min={1}
                step="0.01"
                value={bankroll}
                onChange={(e) => setBankroll(Math.max(1, Number(e.target.value || 1)))}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
                Bankroll application
              </label>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setBankrollMode("per_bet")}
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    bankrollMode === "per_bet"
                      ? "bg-emerald-500 text-slate-950"
                      : "border border-white/10 bg-slate-950 text-white"
                  }`}
                >
                  Per Bet
                </button>

                <button
                  type="button"
                  onClick={() => setBankrollMode("across_plan")}
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    bankrollMode === "across_plan"
                      ? "bg-emerald-500 text-slate-950"
                      : "border border-white/10 bg-slate-950 text-white"
                  }`}
                >
                  Spread Across Plan
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-400">
            {bankrollMode === "per_bet"
              ? "Per Bet mode applies the full bankroll figure to each included opportunity."
              : "Spread Across Plan mode divides the bankroll across all included opportunities automatically."}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Estimated Weekly Range</div>
          <div className="mt-4 text-3xl font-semibold">
            £{summary.minProfit.toFixed(2)} to £{summary.maxProfit.toFixed(2)}
          </div>
          <div className="mt-3 text-sm text-slate-300">
            Percentage increase: {summary.minPct.toFixed(2)}% to {summary.maxPct.toFixed(2)}%
          </div>
          <div className="mt-3 text-sm text-slate-400">
            Total committed: £{summary.totalCommitted.toFixed(2)} • Active bets: {summary.activeCount}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map(({ opportunity, state, metrics, outlay }) => (
          <div
            key={opportunity.id}
            className={`rounded-3xl border p-5 ${
              state.excluded
                ? "border-slate-800 bg-slate-900/60 opacity-60"
                : "border-white/10 bg-white/[0.04]"
            }`}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                  {opportunity.sport}
                  {opportunity.marketLabel ? ` • ${opportunity.marketLabel}` : ""} • Profit Bet
                </div>
                <div className="mt-2 text-xl font-semibold">{opportunity.eventName}</div>
                <div className="mt-3 text-sm text-slate-400">{opportunity.notes.join(" • ")}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:min-w-[360px]">
                <Metric label="Allocated Outlay" value={`£${outlay.toFixed(2)}`} />
                <Metric label="Expected Profit %" value={`${opportunity.expectedProfitPercent.toFixed(2)}%`} />
                <Metric label="Min Profit" value={`£${metrics.minProfit.toFixed(2)}`} />
                <Metric label="Max Profit" value={`£${metrics.maxProfit.toFixed(2)}`} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[220px_1fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Planner Controls</div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                  Completion: {state.completed ? "✓ Completed" : "Pending"}
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                  Execution: {state.executionLogged ? "Logged" : "Not yet logged"}
                </div>

                <button
                  type="button"
                  onClick={() => patch(opportunity.id, { excluded: !state.excluded })}
                  className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm ${
                    state.excluded
                      ? "bg-emerald-500 text-slate-950"
                      : "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  {state.excluded ? "Re-include Bet" : "Exclude Bet"}
                </button>
              </div>

              <div className="space-y-3">
                {metrics.legs.map((leg, idx) => (
                  <div
                    key={`${opportunity.id}-${idx}`}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{leg.outcome}</span> • {leg.bookmaker} • Odds {formatOddsBoth(leg.odds)} • Stake £{leg.adjustedStake.toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => clickLeg(opportunity, metrics.legs, idx, leg.deepLink)}
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          state.clickedLegs[idx]
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : "border border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
                        }`}
                      >
                        {state.clickedLegs[idx] ? `✓ ${leg.bookmaker} opened` : `Open ${leg.bookmaker}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {status[opportunity.id] ? (
              <div className="mt-3 text-sm text-slate-400">{status[opportunity.id]}</div>
            ) : null}
          </div>
        ))}

        {!rows.length ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-400">
            No profit bets are available right now.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}