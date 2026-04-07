import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatEventDateTime } from "@/lib/time-display";

export default async function SavedBetsPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await supabase.rpc("archive_expired_saved_bets");

  const { data, error } = await supabase
    .from("saved_bets")
    .select("id, event_name, event_date, bookmaker_names, amount_staked, amount_returned, status, archived_at, created_at")
    .eq("user_id", user.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Saved Bets"
        title="Tracked bets and recent execution history"
        description="Selections that you open and log move here automatically and remain visible until 24 hours after they finish."
      />

      {error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error.message}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.length ? (
            data.map((row) => (
              <div key={row.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="text-xl font-semibold">{row.event_name}</div>
                    <div className="mt-2 text-sm text-slate-400">
                      {formatEventDateTime(row.event_date)}
                    </div>
                    <div className="mt-2 text-sm text-slate-400">
                      {row.bookmaker_names?.length ? row.bookmaker_names.join(" • ") : "Bookmakers unavailable"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 xl:min-w-[320px]">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Staked</div>
                      <div className="mt-2 text-lg font-semibold">£{Number(row.amount_staked || 0).toFixed(2)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Returned</div>
                      <div className="mt-2 text-lg font-semibold">£{Number(row.amount_returned || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-slate-400">
                  Status: {row.status}
                  {row.archived_at ? ` • Auto-archive: ${formatEventDateTime(row.archived_at)}` : ""}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-400">
              No saved bets yet.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}