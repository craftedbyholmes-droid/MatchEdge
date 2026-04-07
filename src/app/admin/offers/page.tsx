import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { OffersManager } from "@/components/admin/offers-manager";
import { requireAdminUser } from "@/lib/auth";
import { getAdminOffersData } from "@/lib/offers";

export default async function AdminOffersPage() {
  await requireAdminUser();

  const { offers, sources, runs } = await getAdminOffersData();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Offers automation control room"
        description="Manage launch-safe manual offers now, while preparing the exact same data model for future CSV imports, affiliate feeds, and reviewed scraping."
      />

      <OffersManager
        offers={offers as any}
        sources={sources as any}
        runs={runs as any}
      />
    </AppShell>
  );
}