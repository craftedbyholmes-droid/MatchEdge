import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ProfitOnlyPlanClient } from "@/components/planner/profit-only-plan-client";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { attachDeepLinks, buildSurebetOpportunity } from "@/lib/services/calculations";
import { getCachedEventsAcrossSupportedSports } from "@/lib/providers/cached-events";

export default async function PlanPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("bankroll")
    .eq("user_id", user.id)
    .single();

  let opportunities: any[] = [];
  let error = "";

  try {
    const result = await getCachedEventsAcrossSupportedSports({ maxSports: 20, maxEvents: 200 });
    const events = result.events.map(attachDeepLinks);

    opportunities = events
      .map((event) => buildSurebetOpportunity(event, Number(settings?.bankroll || 100)))
      .filter(Boolean);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown planner error";
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Profit Plan"
        title="Weekly planner intelligence"
        description="This page uses your default bankroll from settings, shows an estimated weekly profit range, and lets you apply that bankroll per bet or spread it across the whole plan."
      />

      {error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error}
        </div>
      ) : (
        <ProfitOnlyPlanClient
          opportunities={opportunities as any}
          defaultBankroll={Number(settings?.bankroll || 100)}
        />
      )}
    </AppShell>
  );
}