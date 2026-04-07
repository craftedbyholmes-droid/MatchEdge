import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("user_settings")
    .select("strategy_mode, receive_notifications, receive_daily_top_bets, receive_promotional_offers, hide_qualifying_bets, bankroll")
    .eq("user_id", user.id)
    .single();

  const initial = {
    strategy_mode: data?.strategy_mode || "hybrid",
    receive_notifications: data?.receive_notifications ?? true,
    receive_daily_top_bets: data?.receive_daily_top_bets ?? false,
    receive_promotional_offers: data?.receive_promotional_offers ?? false,
    hide_qualifying_bets: data?.hide_qualifying_bets ?? false,
    bankroll: Number(data?.bankroll || 100),
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Settings"
        title="User rules, notifications, and bankroll defaults"
        description="Users can choose qualifying, profit-only, or hybrid rules and control all opt-ins."
      />

      <SettingsForm initial={initial as any} userId={user.id} />
    </AppShell>
  );
}