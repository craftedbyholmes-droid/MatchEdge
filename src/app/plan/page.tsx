import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ProfitOnlyPlanClient } from "@/components/planner/profit-only-plan-client";
import { requireUser } from "@/lib/auth";
import { getEffectivePlanKey, requirePlanAccess } from "@/lib/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { attachDeepLinks, buildSurebetOpportunity } from "@/lib/services/calculations";
import { getCachedEventsAcrossSupportedSports } from "@/lib/providers/cached-events";
import { extractEventDate } from "@/lib/event-meta";

export default async function PlanPage() {
  const user = await requireUser();
  await requirePlanAccess(user.id, "premium");
  const effectivePlan = await getEffectivePlanKey(user.id);
  const supabase = await createSupabaseServerClient();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("bankroll")
    .eq("user_id", user.id)
    .single();

  let opportunities: any[] = [];
  let error = "";

  try {
    const result = await getCachedEventsAcrossSupportedSports({ maxSports: 20, maxEvents: 300 });
    const events = result.events.map(attachDeepLinks);

    opportunities = events
      .map((event) => {
        const built = buildSurebetOpportunity(event, Number(settings?.bankroll || 100));
        if (!built) return null;

        return {
          ...built,
          eventDate: extractEventDate(event),
        };
      })
      .filter(Boolean);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown planner error";
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Profit Plan"
        title="7-day planner intelligence"
        description="Premium adds date/time ordering and coloured urgency indicators. Pro adds the live countdown timer and stronger 7-day filter controls."
      />

      {error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error}
        </div>
      ) : (
        <ProfitOnlyPlanClient
          opportunities={opportunities as any}
          defaultBankroll={Number(settings?.bankroll || 100)}
          effectivePlan={effectivePlan}
        />
      )}
    </AppShell>
  );
}