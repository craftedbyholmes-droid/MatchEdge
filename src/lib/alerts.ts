import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAlertDashboardData(userId: string) {
  const supabase = await createSupabaseServerClient();

  const [{ data: rules }, { data: deliveries }, { data: contact }] = await Promise.all([
    supabase
      .from("alert_rules")
      .select(`
        id,
        title,
        enabled,
        strategy_mode,
        min_profit_percent,
        sport_keys,
        delivery_in_app,
        delivery_email,
        delivery_sms,
        bookmaker_include,
        bookmaker_exclude,
        kickoff_window_hours,
        cooldown_minutes,
        trigger_type,
        digest_mode,
        quiet_hours_override,
        created_at,
        last_triggered_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("alert_deliveries")
      .select("id, event_name, sport_key, trigger_reason, delivery_channel, delivery_status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),

    supabase
      .from("user_contact_preferences")
      .select("alert_email, sms_enabled, phone_number, timezone, quiet_hours_enabled, quiet_hours_start, quiet_hours_end")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    rules: rules || [],
    deliveries: deliveries || [],
    contact: contact || null,
  };
}