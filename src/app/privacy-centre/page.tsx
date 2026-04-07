import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { CookiePreferencesForm } from "@/components/privacy/cookie-preferences-form";
import { PrivacyRequestForm } from "@/components/privacy/privacy-request-form";
import { DeleteAccountButton } from "@/components/privacy/delete-account-button";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PrivacyCentrePage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: cookiePreferences } = await supabase
    .from("cookie_preferences")
    .select("essential, analytics, marketing")
    .eq("user_id", user.id)
    .single();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Privacy Centre"
        title="Privacy controls and account management"
        description="Manage your data, preferences, and account lifecycle."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <CookiePreferencesForm
          userId={user.id}
          initial={{
            essential: cookiePreferences?.essential ?? true,
            analytics: cookiePreferences?.analytics ?? false,
            marketing: cookiePreferences?.marketing ?? false,
          }}
        />

        <PrivacyRequestForm userId={user.id} />
      </div>

      <div className="mt-6">
        <DeleteAccountButton />
      </div>
    </AppShell>
  );
}