"use client";

import { useState } from "react";

type OfferRow = {
  id: string;
  bookmaker_key: string;
  bookmaker_name: string;
  offer_type: string;
  headline: string;
  short_description: string | null;
  stake_requirement: string | null;
  reward_value: string | null;
  reward_type: string | null;
  min_odds: string | null;
  qualifying_instructions: string | null;
  region: string;
  affiliate_url: string | null;
  source_key?: string | null;
  source_url?: string | null;
  source_last_seen_at?: string | null;
  status: string;
  sort_priority: number;
  created_at: string;
  updated_at: string;
  last_change_summary?: string | null;
};

type SourceRow = {
  id: string;
  source_key: string;
  source_name: string;
  source_type: string;
  enabled: boolean;
  requires_review: boolean;
  notes: string | null;
};

type RunRow = {
  id: string;
  source_key: string | null;
  run_status: string;
  imported_count: number;
  changed_count: number;
  failed_count: number;
  notes: string | null;
  created_at: string;
};

export function OffersManager({
  offers,
  sources,
  runs,
}: {
  offers: OfferRow[];
  sources: SourceRow[];
  runs: RunRow[];
}) {
  const [bookmakerKey, setBookmakerKey] = useState("");
  const [bookmakerName, setBookmakerName] = useState("");
  const [offerType, setOfferType] = useState("welcome");
  const [headline, setHeadline] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [stakeRequirement, setStakeRequirement] = useState("");
  const [rewardValue, setRewardValue] = useState("");
  const [rewardType, setRewardType] = useState("");
  const [minOdds, setMinOdds] = useState("");
  const [qualifyingInstructions, setQualifyingInstructions] = useState("");
  const [region, setRegion] = useState("uk");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [sourceKey, setSourceKey] = useState("manual_admin");
  const [sourceUrl, setSourceUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [sortPriority, setSortPriority] = useState("100");
  const [changeSummary, setChangeSummary] = useState("");
  const [message, setMessage] = useState("");

  async function handleSave() {
    if (!bookmakerKey.trim() || !bookmakerName.trim() || !headline.trim()) {
      setMessage("Bookmaker key, bookmaker name, and headline are required.");
      return;
    }

    setMessage("Saving offer...");

    const response = await fetch("/api/admin/offers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bookmakerKey,
        bookmakerName,
        offerType,
        headline,
        shortDescription,
        stakeRequirement,
        rewardValue,
        rewardType,
        minOdds,
        qualifyingInstructions,
        region,
        affiliateUrl,
        sourceKey,
        sourceUrl,
        status,
        sortPriority: Number(sortPriority || 100),
        changeSummary,
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.ok) {
      setMessage(json.error || "Unable to save offer.");
      return;
    }

    setMessage("Offer saved. Refresh admin to see the updated offers list.");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-3">
        <MetricCard label="Tracked offers" value={String(offers.length)} />
        <MetricCard label="Offer sources" value={String(sources.length)} />
        <MetricCard label="Recent import runs" value={String(runs.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-lg font-semibold">Create / Update Offer</div>
          <p className="mt-2 text-sm text-slate-400">
            Use this as the launch-safe source of truth. Later you can layer CSV import, affiliate feeds, or reviewed scraping on top of the same schema.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Bookmaker key">
              <input value={bookmakerKey} onChange={(e) => setBookmakerKey(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Bookmaker name">
              <input value={bookmakerName} onChange={(e) => setBookmakerName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Offer type">
              <select value={offerType} onChange={(e) => setOfferType(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
                <option value="welcome">Welcome</option>
                <option value="reload">Reload</option>
                <option value="bonus">Bonus</option>
                <option value="free_bet">Free Bet</option>
                <option value="cashback">Cashback</option>
                <option value="enhanced_odds">Enhanced Odds</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Headline">
                <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Short description">
                <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
              </Field>
            </div>

            <Field label="Stake requirement">
              <input value={stakeRequirement} onChange={(e) => setStakeRequirement(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Reward value">
              <input value={rewardValue} onChange={(e) => setRewardValue(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Reward type">
              <input value={rewardType} onChange={(e) => setRewardType(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Minimum odds">
              <input value={minOdds} onChange={(e) => setMinOdds(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <div className="md:col-span-2">
              <Field label="Qualifying instructions">
                <textarea value={qualifyingInstructions} onChange={(e) => setQualifyingInstructions(e.target.value)} rows={4} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
              </Field>
            </div>

            <Field label="Region">
              <input value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Sort priority">
              <input type="number" value={sortPriority} onChange={(e) => setSortPriority(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Affiliate URL">
              <input value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Source key">
              <select value={sourceKey} onChange={(e) => setSourceKey(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
                {sources.map((source) => (
                  <option key={source.id} value={source.source_key}>
                    {source.source_name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Source URL">
                <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Change summary">
                <input value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
              </Field>
            </div>
          </div>

          <button type="button" onClick={handleSave} className="mt-5 rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950">
            Save Offer
          </button>

          {message ? (
            <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              {message}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-lg font-semibold">Offer Sources</div>
            <div className="mt-4 space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-sm font-medium">{source.source_name}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {source.source_key} • {source.source_type} • {source.enabled ? "enabled" : "disabled"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Review required: {source.requires_review ? "yes" : "no"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-lg font-semibold">Recent Import Runs</div>
            <div className="mt-4 space-y-3">
              {runs.length ? runs.map((run) => (
                <div key={run.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-sm font-medium">{run.source_key || "unknown source"}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {run.run_status} • imported {run.imported_count} • changed {run.changed_count} • failed {run.failed_count}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(run.created_at).toLocaleString()}
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
                  No import runs yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-lg font-semibold">Recent Offers</div>
        <div className="mt-4 space-y-3">
          {offers.length ? offers.map((offer) => (
            <div key={offer.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-sm font-medium">{offer.headline}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {offer.bookmaker_name} • {offer.offer_type} • {offer.status}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {offer.last_change_summary || "No change summary"}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Priority {offer.sort_priority} • Updated {new Date(offer.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
              No offers found yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-3">{children}</div>
    </label>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}