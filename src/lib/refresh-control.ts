import { createClient } from "@supabase/supabase-js";

type RefreshMode = "manual" | "hourly" | "live";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !serviceRole || url.startsWith("REPLACE_WITH") || serviceRole.startsWith("REPLACE_WITH")) {
    throw new Error("Supabase admin credentials are not configured.");
  }

  return createClient(url, serviceRole);
}

export async function getRefreshSettings() {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("platform_config")
    .select("refresh_mode, refresh_interval_minutes, last_data_refresh_at, last_data_refresh_status, last_data_refresh_note")
    .single();

  return {
    refreshMode: (data?.refresh_mode || "hourly") as RefreshMode,
    refreshIntervalMinutes: Number(data?.refresh_interval_minutes || 60),
    lastDataRefreshAt: data?.last_data_refresh_at || null,
    lastDataRefreshStatus: data?.last_data_refresh_status || null,
    lastDataRefreshNote: data?.last_data_refresh_note || null,
  };
}

export async function getCachedPayload<T = any>(cacheKey: string): Promise<{ payload: T | null; fetchedAt: string | null }> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("provider_cache_snapshots")
    .select("payload, fetched_at")
    .eq("cache_key", cacheKey)
    .single();

  return {
    payload: (data?.payload as T) || null,
    fetchedAt: data?.fetched_at || null,
  };
}

export async function setCachedPayload(cacheKey: string, payload: any, providerName = "the_odds_api", status = "ok", note = "") {
  const supabase = getSupabaseAdmin();

  await supabase.from("provider_cache_snapshots").upsert({
    cache_key: cacheKey,
    payload,
    fetched_at: new Date().toISOString(),
    provider_name: providerName,
    status,
    note,
  });

  await supabase
    .from("platform_config")
    .update({
      last_data_refresh_at: new Date().toISOString(),
      last_data_refresh_status: status,
      last_data_refresh_note: note || null,
    })
    .neq("refresh_mode", "");
}

export function isCacheFresh(fetchedAt: string | null, refreshIntervalMinutes: number) {
  if (!fetchedAt) return false;

  const fetchedMs = new Date(fetchedAt).getTime();
  const nowMs = Date.now();
  const maxAgeMs = Math.max(1, refreshIntervalMinutes) * 60 * 1000;

  return nowMs - fetchedMs < maxAgeMs;
}