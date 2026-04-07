import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { requirePlanAccess } from "@/lib/access";
import { getAlertDashboardData } from "@/lib/alerts";
import { AlertsManager } from "@/components/alerts/alerts-manager";

export default async function AlertsPage() {
  const user = await requireUser();
  await requirePlanAccess(user.id, "premium");

  const { rules, deliveries, contact } = await getAlertDashboardData(user.id);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Alerts"
        title="Premium alert rules and monitoring"
        description="Premium users can create selective alert rules around sport, profit threshold, delivery method, cooldowns, and kickoff timing. The goal is fewer, better notifications."
      />

      <AlertsManager
        initialRules={rules as any}
        initialDeliveries={deliveries as any}
        initialContact={contact as any}
      />
    </AppShell>
  );
}