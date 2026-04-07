import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OfferRow = {
  id: string;
  bookmaker_key: string;
  bookmaker_name: string;
  offer_type: string;
  headline: string;
  short_description: string | null;
  stake_requirement: string | null;
  reward_value: string | null;
  reward_type: string | null;
  min_odds: string | null;
  qualifying_instructions: string | null;
  region: string;
  affiliate_url: string | null;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  sort_priority: number;
  created_at: string;
};

export async function getOffersPageData(region = "uk") {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("offers")
    .select(`
      id,
      bookmaker_key,
      bookmaker_name,
      offer_type,
      headline,
      short_description,
      stake_requirement,
      reward_value,
      reward_type,
      min_odds,
      qualifying_instructions,
      region,
      affiliate_url,
      status,
      starts_at,
      expires_at,
      sort_priority,
      created_at
    `)
    .eq("region", region)
    .eq("status", "active")
    .order("sort_priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getAdminOffersData() {
  const supabase = await createSupabaseServerClient();

  const [{ data: offers }, { data: sources }, { data: runs }] = await Promise.all([
    supabase
      .from("offers")
      .select(`
        id,
        bookmaker_key,
        bookmaker_name,
        offer_type,
        headline,
        short_description,
        stake_requirement,
        reward_value,
        reward_type,
        min_odds,
        qualifying_instructions,
        region,
        affiliate_url,
        source_key,
        source_url,
        source_last_seen_at,
        status,
        sort_priority,
        created_at,
        updated_at,
        last_change_summary
      `)
      .order("updated_at", { ascending: false })
      .limit(100),

    supabase
      .from("offer_sources")
      .select("id, source_key, source_name, source_type, enabled, requires_review, notes")
      .order("source_name", { ascending: true }),

    supabase
      .from("offer_import_runs")
      .select("id, source_key, run_status, imported_count, changed_count, failed_count, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    offers: offers || [],
    sources: sources || [],
    runs: runs || [],
  };
}