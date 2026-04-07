import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SavedPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("saved_opportunities")
    .select("id, event_name, sport, market_label, kind, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Saved Bets"
        title="Saved opportunities"
        description="Keep promising opportunities here for review, comparison, or later execution when the edge still justifies it."
      />

      {data?.length ? (
        <div className="space-y-4">
          {data.map((row) => (
            <div key={row.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                {row.sport || "Unknown sport"}{row.market_label ? ` • ${row.market_label}` : ""}
              </div>
              <div className="mt-2 text-xl font-semibold">{row.event_name}</div>
              <div className="mt-2 text-sm capitalize text-slate-400">{row.kind}</div>
              <div className="mt-2 text-xs text-slate-500">{new Date(row.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved opportunities yet"
          description="Save only the opportunities that still deserve attention. A good saved list should stay useful, not become a dumping ground."
        />
      )}
    </AppShell>
  );
}