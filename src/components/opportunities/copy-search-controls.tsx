"use client";

import { useState } from "react";
import { buildSelectionSearchText, splitEventTeams } from "@/lib/bookmaker-search";

export function CopySearchControls({
  eventName,
  outcome,
  bookmaker,
}: {
  eventName?: string | null;
  outcome?: string | null;
  bookmaker?: string | null;
}) {
  const [status, setStatus] = useState("");

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied`);
      window.setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus(`Unable to copy ${label.toLowerCase()}`);
      window.setTimeout(() => setStatus(""), 2000);
    }
  }

  const teams = splitEventTeams(eventName);
  const selectionText = buildSelectionSearchText({ eventName, outcome, bookmaker });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {teams.combinedSearch ? (
        <button
          type="button"
          onClick={() => copyText(teams.combinedSearch, "Teams")}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
        >
          Copy Teams
        </button>
      ) : null}

      {selectionText ? (
        <button
          type="button"
          onClick={() => copyText(selectionText, "Selection")}
          className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100"
        >
          Copy Selection
        </button>
      ) : null}

      {status ? <div className="text-xs text-slate-400">{status}</div> : null}
    </div>
  );
}