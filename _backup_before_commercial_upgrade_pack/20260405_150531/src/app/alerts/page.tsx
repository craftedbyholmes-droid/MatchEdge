import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AlertsPage() {
  const user = await requireUser();
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
        description="Use alerts to stay selective. Strong alerting should reduce wasted action, not increase needless activity."
      />

      {data?.length ? (
        <div className="space-y-4">
          {data.map((row) => (
            <div key={row.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-lg font-semibold">{row.title}</div>
              <div className="mt-2 text-sm text-slate-400">
                Mode: {row.strategy_mode || "any"} • Minimum profit: {row.min_profit_percent ?? "n/a"}% • {row.enabled ? "Enabled" : "Disabled"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No alert rules yet"
          description="A clean launch setup can begin with a few selective rules, such as a minimum profit threshold or a preferred strategy mode, rather than too many noisy alerts."
        />
      )}
    </AppShell>
  );
}