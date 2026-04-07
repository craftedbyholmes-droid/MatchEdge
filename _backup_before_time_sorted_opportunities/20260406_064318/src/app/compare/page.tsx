import { AppShell } from "@/components/layout/app-shell";
import { CompareClient } from "@/components/compare/compare-client";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { attachDeepLinks, buildQualifyingOpportunity, buildSurebetOpportunity } from "@/lib/services/calculations";
import { getCachedEventsAcrossSupportedSports } from "@/lib/providers/cached-events";

export default async function ComparePage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  let error = "";
  let opportunities: any[] = [];

  const { data: offerUsage } = await supabase
    .from("offer_usage")
    .select("bookmaker_key")
    .eq("user_id", user.id);

  const usedOfferBookmakers = (offerUsage || []).map((row) => row.bookmaker_key);

  try {
    const result = await getCachedEventsAcrossSupportedSports({ maxSports: 20, maxEvents: 200 });
    const events = result.events.map(attachDeepLinks);

    const profitBets = events
      .map((event) => buildSurebetOpportunity(event, 100))
      .filter(Boolean);

    const welcomeOffers = events
      .map((event) => buildQualifyingOpportunity(event))
      .filter(Boolean);

    opportunities = [...profitBets, ...welcomeOffers];
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown compare error";
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Compare"
        title="Offers and profit bets"
        description="Compare shows both welcome or qualifying routes and mathematically profitable bets, with used welcome bookmakers filtered out from the offer side."
      />

      {error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error}
        </div>
      ) : (
        <CompareClient opportunities={opportunities as any} usedOfferBookmakers={usedOfferBookmakers} />
      )}
    </AppShell>
  );
}