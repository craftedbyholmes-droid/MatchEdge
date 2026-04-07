"use client";


function getLegStake(leg: any) {
  return Number(
    leg?.stake ??
    leg?.stakeAmount ??
    leg?.plannedStake ??
    leg?.stake_decimal ??
    0
  );
}

import { useMemo, useState } from "react";

type StrategyMode = "qualifying" | "profit" | "hybrid";

type Leg = {
  outcome: string;
  bookmaker: string;
  odds: number;
  deepLink?: string;
};

type Opportunity = {
  id: string;
  eventName: string;
  sport: string;
  marketLabel?: string;
  kind: "qualifying" | "surebet" | "guaranteed_profit" | "offer_cycle";
  impliedProbability: number;
  marginPercent: number;
  expectedProfitPercent: number;
  qualifyingLossPercent?: number;
  stakePlan: Leg[];
  notes: string[];
};

type RowState = {
  excluded: boolean;
  completed: boolean;
  clickedLegs: boolean[];
  maxOutlay: number;
};

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function decimalToFractional(decimalOdds: number) {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return "â€”";
  const profitPart = decimalOdds - 1;
  const precision = 100;
  const numerator = Math.round(profitPart * precision);
  const denominator = precision;
  const divisor = gcd(numerator, denominator);
  return `${numerator / divisor}/${denominator / divisor}`;
}

function formatOdds(decimalOdds: number) {
  return `${decimalOdds.toFixed(2)} (${decimalToFractional(decimalOdds)})`;
}

function computeLastProfitableOdds(opportunity: Opportunity, legIndex: number) {
  const otherLegs = opportunity.stakePlan.filter((_, idx) => idx !== legIndex);
  const otherImplied = otherLegs.reduce((sum, leg) => sum + 1 / leg.odds, 0);

  if (otherImplied >= 1) {
    return null;
  }

  return 1 / (1 - otherImplied);
}

function deriveModeBucket(opportunity: Opportunity): StrategyMode {
  if (opportunity.kind === "qualifying" || opportunity.kind === "offer_cycle") {
    return "qualifying";
  }

  return "profit";
}

function computeSelectionMetrics(opportunity: Opportunity, maxOutlay: number) {
  const totalOriginalStake = opportunity.stakePlan.reduce((sum, leg) => sum + getLegStake(leg), 0) || 1;
  const scale = maxOutlay / totalOriginalStake;

  const adjustedLegs = opportunity.stakePlan.map((leg) => ({
    ...leg,
    adjustedStake: Number((leg.stake * scale).toFixed(2)),
  }));

  const returns = adjustedLegs.map((leg) => leg.adjustedStake * leg.odds);
  const minReturn = Math.min(...returns);
  const maxReturn = Math.max(...returns);
  const minProfit = Number((minReturn - maxOutlay).toFixed(2));
  const maxProfit = Number((maxReturn - maxOutlay).toFixed(2));

  return {
    adjustedLegs,
    minProfit,
    maxProfit,
  };
}

export function WeeklyPlanClient({
  opportunities,
  initialBankroll,
  initialMode,
}: {
  opportunities: Opportunity[];
  initialBankroll: number;
  initialMode: StrategyMode;
}) {
  const [mode, setMode] = useState<StrategyMode>(initialMode);
  const [states, setStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      opportunities.map((opportunity) => [
        opportunity.id,
        {
          excluded: false,
          completed: false,
          clickedLegs: opportunity.stakePlan.map(() => false),
          maxOutlay: Math.max(
            5,
            Number(
              (
                opportunity.stakePlan.reduce((sum, leg) => sum + getLegStake(leg), 0) || 25
              ).toFixed(2)
            )
          ),
        },
      ])
    )
  );

  const filtered = useMemo(() => {
    return opportunities.filter((opportunity) => {
      const bucket = deriveModeBucket(opportunity);

      if (mode === "hybrid") return true;
      if (mode === "profit") return bucket === "profit";
      return bucket === "qualifying";
    });
  }, [mode, opportunities]);

  const visibleRows = useMemo(() => {
    return filtered
      .map((opportunity) => {
        const rowState = states[opportunity.id];
        const metrics = computeSelectionMetrics(opportunity, rowState?.maxOutlay || 25);

        return {
          opportunity,
          rowState,
          metrics,
          bucket: deriveModeBucket(opportunity),
        };
      })
      .sort((a, b) => b.metrics.maxProfit - a.metrics.maxProfit);
  }, [filtered, states]);

  const planSummary = useMemo(() => {
    const active = visibleRows.filter((row) => !row.rowState?.excluded);
    const completed = active.filter((row) => row.rowState?.completed);

    const activeMin = active.reduce((sum, row) => sum + row.metrics.minProfit, 0);
    const activeMax = active.reduce((sum, row) => sum + row.metrics.maxProfit, 0);
    const completedCount = completed.length;

    return {
      count: active.length,
      completedCount,
      minProfit: Number(activeMin.toFixed(2)),
      maxProfit: Number(activeMax.toFixed(2)),
    };
  }, [visibleRows]);

  function updateRow(id: string, patch: Partial<RowState>) {
    setStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }));
  }

  function toggleExclude(id: string) {
    updateRow(id, { excluded: !states[id]?.excluded });
  }

  function setOutlay(id: string, value: number) {
    updateRow(id, { maxOutlay: Math.max(1, Number.isFinite(value) ? value : 1) });
  }

  function clickLeg(opportunityId: string, legIndex: number, url?: string) {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    setStates((prev) => {
      const current = prev[opportunityId];
      const clickedLegs = [...(current?.clickedLegs || [])];
      clickedLegs[legIndex] = true;

      const completed = clickedLegs.every(Boolean);

      return {
        ...prev,
        [opportunityId]: {
          ...current,
          clickedLegs,
          completed,
        },
      };
    });
  }

  async function recallRemaining() {
    const active = visibleRows.filter((row) => !row.rowState.excluded && !row.rowState.completed);

    if (!active.length) {
      window.alert("No remaining unplaced selections to refresh.");
      return;
    }

    const res = await fetch("/api/opportunities?profitOnly=false");
    const json = await res.json();

    if (!res.ok || !json.ok) {
      window.alert(json.error || "Refresh failed.");
      return;
    }

    window.alert("API recall completed for remaining selections. Reload the page to compare refreshed opportunities.");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-center gap-3">
            {(["profit", "qualifying", "hybrid"] as StrategyMode[]).map((value) => (
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
                {value === "qualifying" ? "Welcome Only" : value === "profit" ? "Profit Only" : "Hybrid"}
              </button>
            ))}

            <button
              type="button"
              onClick={recallRemaining}
              className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200"
            >
              Refresh Remaining Selections
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            The weekly planner shows all eligible opportunities for the coming week, recalculates the profit range as rows are completed or excluded, and lets you limit maximum outlay per combination.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Weekly Plan Range</div>
          <div className="mt-4 text-3xl font-semibold">
            Â£{planSummary.minProfit.toFixed(2)} to Â£{planSummary.maxProfit.toFixed(2)}
          </div>
          <div className="mt-3 text-sm text-slate-400">
            Active combinations: {planSummary.count} â€¢ Completed: {planSummary.completedCount}
          </div>
          <div className="mt-3 text-sm text-slate-500">
            Range updates every time a selection is excluded, an outlay changes, or all links on a row are clicked.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {visibleRows.map(({ opportunity, rowState, metrics, bucket }) => (
          <div
            key={opportunity.id}
            className={`rounded-3xl border p-5 ${
              rowState.excluded
                ? "border-slate-800 bg-slate-900/60 opacity-60"
                : "border-white/10 bg-white/[0.04]"
            }`}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                  {opportunity.sport}{opportunity.marketLabel ? ` â€¢ ${opportunity.marketLabel}` : ""} â€¢ {bucket === "qualifying" ? "Welcome/Qualifying" : "Profit"}
                </div>
                <div className="mt-2 text-xl font-semibold">{opportunity.eventName}</div>
                <div className="mt-3 text-sm text-slate-400">{opportunity.notes.join(" â€¢ ")}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:min-w-[360px]">
                <Metric label="Implied %" value={`${(opportunity.impliedProbability * 100).toFixed(2)}%`} />
                <Metric label="Margin" value={`${opportunity.marginPercent.toFixed(2)}%`} />
                <Metric label="Min Profit" value={`Â£${metrics.minProfit.toFixed(2)}`} />
                <Metric label="Max Profit" value={`Â£${metrics.maxProfit.toFixed(2)}`} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[220px_1fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <label className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Per-bet maximum outlay
                </label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={rowState.maxOutlay}
                  onChange={(e) => setOutlay(opportunity.id, Number(e.target.value || 0))}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                />

                <button
                  type="button"
                  onClick={() => toggleExclude(opportunity.id)}
                  className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm ${
                    rowState.excluded
                      ? "bg-emerald-500 text-slate-950"
                      : "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  {rowState.excluded ? "Re-include Selection" : "Exclude Selection"}
                </button>

                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                  Completion: {rowState.completed ? "âœ“ Completed" : "Pending"}
                </div>
              </div>

              <div className="space-y-3">
                {metrics.adjustedLegs.map((leg, legIndex) => {
                  const lastProfitableOdds = computeLastProfitableOdds(opportunity, legIndex);
                  const clicked = rowState.clickedLegs[legIndex];

                  return (
                    <div key={`${opportunity.id}-${legIndex}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium">{leg.outcome}</span> â€¢ {leg.bookmaker}
                          </div>
                          <div className="mt-2 text-sm text-slate-400">
                            Current odds: {formatOdds(leg.odds)} â€¢ Stake: Â£{leg.adjustedStake.toFixed(2)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Last profitable price: {lastProfitableOdds ? formatOdds(lastProfitableOdds) : "Not applicable"}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => clickLeg(opportunity.id, legIndex, leg.deepLink)}
                            className={`rounded-2xl px-4 py-3 text-sm ${
                              clicked
                                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                : "border border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
                            }`}
                          >
                            {clicked ? `âœ“ ${leg.bookmaker} opened` : `Open ${leg.bookmaker}`}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {rowState.completed ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    This combination has been marked complete because all bookmaker links were opened.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
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
