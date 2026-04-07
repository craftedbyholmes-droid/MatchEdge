"use client";

import { useState } from "react";

type RefreshMode = "manual" | "hourly" | "live";

export function RefreshControls({
  initialMode,
  initialIntervalMinutes,
  lastRefreshAt,
  lastRefreshStatus,
  lastRefreshNote,
}: {
  initialMode: RefreshMode;
  initialIntervalMinutes: number;
  lastRefreshAt: string | null;
  lastRefreshStatus: string | null;
  lastRefreshNote: string | null;
}) {
  const [refreshMode, setRefreshMode] = useState<RefreshMode>(initialMode);
  const [refreshIntervalMinutes, setRefreshIntervalMinutes] = useState(initialIntervalMinutes);
  const [status, setStatus] = useState("");

  async function saveSettings() {
    setStatus("Saving refresh settings...");

    const res = await fetch("/api/admin/refresh-settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshMode, refreshIntervalMinutes }),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      setStatus(json.error || "Unable to save refresh settings.");
      return;
    }

    setStatus("Refresh settings saved. Reload admin to confirm.");
  }

  async function forceRefresh() {
    setStatus("Refreshing live data now...");

    const res = await fetch("/api/admin/force-refresh", {
      method: "POST",
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      setStatus(json.error || "Unable to refresh live data.");
      return;
    }

    setStatus(`Live refresh complete. ${json.count} events cached.`);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-lg font-semibold">Data Refresh Controls</div>
      <p className="mt-2 text-sm text-slate-400">
        Use cached data during testing to limit API usage. Hourly mode is the best pre-launch setting.
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <select
          value={refreshMode}
          onChange={(e) => setRefreshMode(e.target.value as RefreshMode)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
        >
          <option value="manual">Manual only</option>
          <option value="hourly">Hourly cache</option>
          <option value="live">Live / no cache</option>
        </select>

        <select
          value={refreshIntervalMinutes}
          onChange={(e) => setRefreshIntervalMinutes(Number(e.target.value))}
          disabled={refreshMode !== "hourly"}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none disabled:opacity-50"
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>60 minutes</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Info label="Last refresh" value={lastRefreshAt ? new Date(lastRefreshAt).toLocaleString() : "Never"} />
        <Info label="Last status" value={lastRefreshStatus || "Unknown"} />
        <Info label="Note" value={lastRefreshNote || "None"} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveSettings}
          className="rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
        >
          Save Refresh Settings
        </button>

        <button
          type="button"
          onClick={forceRefresh}
          className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-5 py-3 font-medium text-cyan-200"
        >
          Force Refresh Now
        </button>
      </div>

      {status ? <div className="mt-3 text-sm text-slate-400">{status}</div> : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm text-slate-200">{value}</div>
    </div>
  );
}