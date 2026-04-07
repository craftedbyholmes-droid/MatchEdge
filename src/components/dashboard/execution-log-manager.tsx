"use client";

import { useState } from "react";
import { cancelExecution, markExecutionVoid, settleExecution } from "@/lib/execution";

type Row = {
  id: string;
  event_name: string;
  amount_staked: number;
  amount_returned: number;
  profit_loss: number;
  status: string;
  bookmaker_names: string[] | null;
  created_at: string;
  settled_at: string | null;
};

export function ExecutionLogManager({
  rows,
}: {
  rows: Row[];
}) {
  const [returnedValues, setReturnedValues] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((row) => [row.id, String(Number(row.amount_returned || 0).toFixed(2))]))
  );
  const [status, setStatus] = useState("");

  async function handleSettle(id: string) {
    try {
      setStatus("Settling execution...");
      await settleExecution(id, Number(returnedValues[id] || 0));
      setStatus("Execution settled. Refresh the page to see updated totals.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to settle execution.");
    }
  }

  async function handleVoid(id: string) {
    try {
      setStatus("Marking execution void...");
      await markExecutionVoid(id);
      setStatus("Execution marked void. Refresh the page to see updated totals.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to mark execution void.");
    }
  }

  async function handleCancel(id: string) {
    try {
      setStatus("Cancelling execution...");
      await cancelExecution(id);
      setStatus("Execution cancelled. Refresh the page to see updated totals.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to cancel execution.");
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-lg font-semibold">Execution Log</div>
      <div className="mt-2 text-sm text-slate-400">
        Pending executions can be settled, voided, or cancelled. Settled figures flow into your dashboard totals.
      </div>

      <div className="mt-4 space-y-4">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <div className="text-sm font-medium">{row.event_name}</div>
                  <div className="text-xs text-slate-500">
                    {row.bookmaker_names?.length ? row.bookmaker_names.join(" • ") : "Bookmakers not recorded"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Logged: {new Date(row.created_at).toLocaleString()}
                    {row.settled_at ? ` • Settled: ${new Date(row.settled_at).toLocaleString()}` : ""}
                  </div>
                  <div className="text-sm text-slate-300">
                    Stake £{Number(row.amount_staked || 0).toFixed(2)} • Returned £{Number(row.amount_returned || 0).toFixed(2)} • P/L £{Number(row.profit_loss || 0).toFixed(2)} • {row.status}
                  </div>
                </div>

                <div className="w-full space-y-3 xl:w-[280px]">
                  <input
                    type="number"
                    step="0.01"
                    value={returnedValues[row.id] || "0"}
                    onChange={(e) =>
                      setReturnedValues((prev) => ({
                        ...prev,
                        [row.id]: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                    placeholder="Actual returned amount"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSettle(row.id)}
                      className="rounded-2xl bg-emerald-500 px-3 py-3 text-xs font-medium text-slate-950"
                    >
                      Settle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVoid(row.id)}
                      className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs text-amber-200"
                    >
                      Void
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(row.id)}
                      className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-3 text-xs text-rose-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-400">No execution rows yet.</div>
        )}
      </div>

      {status ? <div className="mt-4 text-sm text-slate-400">{status}</div> : null}
    </div>
  );
}