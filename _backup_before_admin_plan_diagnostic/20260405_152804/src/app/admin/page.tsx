import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AdminAnalytics } from "@/components/admin/admin-analytics";
import { CompliancePanels } from "@/components/admin/compliance-panels";
import { PlanGrantsManager } from "@/components/admin/plan-grants-manager";
import { RefreshControls } from "@/components/admin/refresh-controls";
import { requireAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const adminUser = await requireAdminUser();
  const supabase = await createSupabaseServerClient();

  const [
    { count: profiles },
    { count: chats },
    { count: offersUsed },
    { count: executionLogs },
    { count: openPrivacyRequests },
    { count: openBreaches },
    { count: activeVendors },
    { count: consents },
    { data: privacyRequests },
    { data: breaches },
    { data: vendors },
    { data: config },
    { data: profileRows },
    { data: activeGrants },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("chats").select("*", { count: "exact", head: true }),
    supabase.from("offer_usage").select("*", { count: "exact", head: true }),
    supabase.from("user_execution_log").select("*", { count: "exact", head: true }),
    supabase.from("data_subject_requests").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("breach_log").select("*", { count: "exact", head: true }).neq("status", "completed"),
    supabase.from("vendor_register").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("privacy_consents").select("*", { count: "exact", head: true }),
    supabase.from("data_subject_requests").select("id, request_type, status, request_details, created_at").eq("status", "open").order("created_at", { ascending: false }).limit(8),
    supabase.from("breach_log").select("id, title, description, severity, reportable, status, created_at").neq("status", "completed").order("created_at", { ascending: false }).limit(8),
    supabase.from("vendor_register").select("id, vendor_name, purpose, lawful_basis, location").eq("active", true).order("vendor_name", { ascending: true }).limit(20),
    supabase.from("platform_config").select("admin_allowlist_emails, refresh_mode, refresh_interval_minutes, last_data_refresh_at, last_data_refresh_status, last_data_refresh_note").single(),
    supabase.from("profiles").select("id, email, username, display_name").order("created_at", { ascending: false }).limit(200),
    supabase
      .from("admin_plan_grants")
      .select("id, user_id, plan_key, access_type, starts_at, expires_at, note, is_active, profiles:profiles(email, username, display_name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Operations, analytics, and compliance"
        description="A live operational window into users, offers, execution activity, privacy requests, incidents, vendor accountability, manual plan access, and data refresh control."
      />

      <AdminAnalytics
        stats={{
          profiles: profiles || 0,
          chats: chats || 0,
          offersUsed: offersUsed || 0,
          executionLogs: executionLogs || 0,
          openPrivacyRequests: openPrivacyRequests || 0,
          openBreaches: openBreaches || 0,
          activeVendors: activeVendors || 0,
          consents: consents || 0,
        }}
      />

      <div className="mt-6">
        <RefreshControls
          initialMode={(config?.refresh_mode || "hourly") as any}
          initialIntervalMinutes={Number(config?.refresh_interval_minutes || 60)}
          lastRefreshAt={config?.last_data_refresh_at || null}
          lastRefreshStatus={config?.last_data_refresh_status || null}
          lastRefreshNote={config?.last_data_refresh_note || null}
        />
      </div>

      <div className="mt-6">
        <PlanGrantsManager
          profiles={(profileRows || []) as any}
          activeGrants={(activeGrants || []) as any}
          adminUserId={adminUser.id}
        />
      </div>

      <div className="mt-6">
        <CompliancePanels
          privacyRequests={privacyRequests || []}
          breaches={breaches || []}
          vendors={vendors || []}
          allowlist={config?.admin_allowlist_emails || []}
        />
      </div>
    </AppShell>
  );
}