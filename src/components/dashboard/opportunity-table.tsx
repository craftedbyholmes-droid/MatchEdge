import { Opportunity } from "@/lib/types";

function TypeBadge({ type }: { type: Opportunity["kind"] }) {
  const style =
    type === "surebet" || type === "guaranteed_profit"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : "border-amber-500/40 bg-amber-500/10 text-amber-100";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.25em] ${style}`}>
      {type.replaceAll("_", " ")}
    </span>
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

function BookmakerAction({
  bookmaker,
  url,
}: {
  bookmaker: string;
  url?: string;
}) {
  if (!url) {
    return (
      <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-slate-400">
        {bookmaker} link unavailable
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200"
    >
      Open {bookmaker}
    </a>
  );
}

export function OpportunityTable({ items }: { items: Opportunity[] }) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
        No opportunities returned. Check API quota, keys, sports discovery, or bookmaker coverage.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                {item.sport}{item.marketLabel ? ` • ${item.marketLabel}` : ""}
              </div>
              <div className="mt-2 text-xl font-semibold">{item.eventName}</div>
              <div className="mt-3">
                <TypeBadge type={item.kind} />
              </div>
              <div className="mt-3 text-sm text-slate-400">{item.notes.join(" • ")}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
              <Metric label="Implied %" value={`${(item.impliedProbability * 100).toFixed(2)}%`} />
              <Metric label="Margin" value={`${item.marginPercent.toFixed(2)}%`} />
              <Metric label="Expected Profit" value={`${item.expectedProfitPercent.toFixed(2)}%`} />
              <Metric
                label="Qualifying Loss"
                value={item.qualifyingLossPercent !== undefined ? `${item.qualifyingLossPercent.toFixed(2)}%` : "—"}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {item.stakePlan.map((leg, idx) => (
              <div key={`${item.id}-${idx}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{leg.outcome}</span> • {leg.bookmaker} • Odds {leg.odds}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span>Stake £{leg.stake.toFixed(2)}</span>
                    <BookmakerAction bookmaker={leg.bookmaker} url={leg.deepLink} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}