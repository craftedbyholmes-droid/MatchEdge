import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { requirePlanAccess } from "@/lib/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AlertsPage() {
  const user = await requireUser();
  await requirePlanAccess(user.id, "premium");
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("alert_rules")
    .select("id, title, strategy_mode, min_profit_percent, enabled, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Alerts"
        title="Alert rules and monitoring"
        description="Premium alerting should help you stay selective, not noisy. Focus on the quality of a trigger, not the volume of triggers."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-lg font-semibold">Commercial Alert Framework</div>
          <div className="mt-3 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              Minimum profit threshold rules
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              Strategy mode rules: profit-only / welcome-only / hybrid
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              Bookmaker preference and blacklist controls
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              Delivery preferences: in-app / daily roundup / promotional opt-in aware
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-lg font-semibold">Recent Rules</div>
          <div className="mt-4 space-y-3">
            {data?.length ? (
              data.map((row) => (
                <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-sm font-medium">{row.title}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {row.enabled ? "Enabled" : "Disabled"} • Mode: {row.strategy_mode || "any"} • Minimum profit: {row.min_profit_percent ?? "n/a"}%
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
                No alert rules yet. A commercial-grade setup usually starts with a small number of strong rules rather than a flood of weak ones.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}