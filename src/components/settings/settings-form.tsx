"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type StrategyMode = "qualifying" | "profit" | "hybrid";

export function SettingsForm({
  initial,
  userId,
}: {
  initial: {
    strategy_mode: StrategyMode;
    receive_notifications: boolean;
    receive_daily_top_bets: boolean;
    receive_promotional_offers: boolean;
    hide_qualifying_bets: boolean;
    bankroll: number;
  };
  userId: string;
}) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState("");

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function save() {
    setStatus("Saving...");
    const { error } = await supabase.from("user_settings").upsert({
      user_id: userId,
      strategy_mode: form.strategy_mode,
      receive_notifications: form.receive_notifications,
      receive_daily_top_bets: form.receive_daily_top_bets,
      receive_promotional_offers: form.receive_promotional_offers,
      hide_qualifying_bets: form.hide_qualifying_bets,
      bankroll: form.bankroll,
    });

    setStatus(error ? error.message : "Saved");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-lg font-semibold">Strategy Mode</div>
        <p className="mt-2 text-sm text-slate-400">
          Users can switch between qualifying-only, profit-only, or hybrid logic.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(["qualifying", "profit", "hybrid"] as StrategyMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, strategy_mode: mode }))}
              className={`rounded-2xl border px-4 py-4 text-left ${
                form.strategy_mode === mode
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-white/10 bg-slate-950/60"
              }`}
            >
              <div className="text-sm font-medium capitalize">{mode}</div>
              <div className="mt-2 text-xs text-slate-400">
                {mode === "qualifying" && "Focus on offer-unlock and controlled loss workflows."}
                {mode === "profit" && "Show only no-loss style opportunities wherever mathematically valid."}
                {mode === "hybrid" && "Blend qualifying routes with profit-only opportunities."}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-lg font-semibold">Notifications & Filters</div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Toggle
            label="Receive Notifications"
            checked={form.receive_notifications}
            onChange={(checked) => setForm((prev) => ({ ...prev, receive_notifications: checked }))}
          />
          <Toggle
            label="Daily Top Bets"
            checked={form.receive_daily_top_bets}
            onChange={(checked) => setForm((prev) => ({ ...prev, receive_daily_top_bets: checked }))}
          />
          <Toggle
            label="Promotional Offers"
            checked={form.receive_promotional_offers}
            onChange={(checked) => setForm((prev) => ({ ...prev, receive_promotional_offers: checked }))}
          />
          <Toggle
            label="Hide Qualifying Bets"
            checked={form.hide_qualifying_bets}
            onChange={(checked) => setForm((prev) => ({ ...prev, hide_qualifying_bets: checked }))}
          />
        </div>

        <div className="mt-6">
          <label className="text-sm text-slate-300">Default Bankroll</label>
          <input
            type="number"
            min={1}
            step="1"
            value={form.bankroll}
            onChange={(e) => setForm((prev) => ({ ...prev, bankroll: Number(e.target.value || 0) }))}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          />
        </div>

        <button
          type="button"
          onClick={save}
          className="mt-6 rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
        >
          Save Settings
        </button>

        {status ? <div className="mt-3 text-sm text-slate-400">{status}</div> : null}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4"
    >
      <span className="text-sm text-slate-200">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs ${checked ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-800 text-slate-400"}`}>
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}