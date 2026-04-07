import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: usedOffers }, { data: executionRows }] = await Promise.all([
    supabase
      .from("offer_usage")
      .select("bookmaker_key, bookmaker_name, used_at")
      .eq("user_id", user.id)
      .order("used_at", { ascending: false }),
    supabase
      .from("user_execution_log")
      .select("amount_staked, amount_returned, profit_loss, is_loss, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const totalStaked = (executionRows || []).reduce((sum, row) => sum + Number(row.amount_staked || 0), 0);
  const totalReturned = (executionRows || []).reduce((sum, row) => sum + Number(row.amount_returned || 0), 0);
  const totalProfit = Number((totalReturned - totalStaked).toFixed(2));
  const totalLossRows = (executionRows || []).filter((row) => row.is_loss).length;

  let runningStake = 0;
  let runningReturn = 0;

  const chartRows = (executionRows || []).map((row, idx) => {
    runningStake += Number(row.amount_staked || 0);
    runningReturn += Number(row.amount_returned || 0);

    return {
      label: `#${idx + 1}`,
      stakedTotal: Number(runningStake.toFixed(2)),
      returnedTotal: Number(runningReturn.toFixed(2)),
    };
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        title="Account overview and performance"
        description="Track used offers, running profit/loss, and performance over time without mixing this page into the active opportunity browser."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Offers Used" value={String((usedOffers || []).length)} hint="Used welcome/bonus bookmakers" />
        <StatCard label="Total Staked" value={`£${totalStaked.toFixed(2)}`} hint="All recorded execution stakes" />
        <StatCard label="Total Returned" value={`£${totalReturned.toFixed(2)}`} hint="Including profit and stake return" />
        <StatCard label="Net Position" value={`£${totalProfit.toFixed(2)}`} hint={totalProfit >= 0 ? "Positive net result" : "Negative net result"} />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-lg font-semibold">Used Offer Bookmakers</div>
            <div className="mt-4 space-y-3">
              {(usedOffers || []).length ? (
                usedOffers!.map((row, idx) => (
                  <div key={`${row.bookmaker_key}-${idx}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="text-sm font-medium">{row.bookmaker_name}</div>
                    <div className="mt-1 text-xs text-slate-500">{new Date(row.used_at).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400">No offer usage logged yet.</div>
              )}
            </div>
          </div>

          {totalLossRows > 0 ? (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
              Some recorded bets show losses. Take extra care when confirming odds, stake sizing, and leg completion.
            </div>
          ) : null}
        </div>

        <PerformanceChart rows={chartRows} />
      </div>
    </AppShell>
  );
}