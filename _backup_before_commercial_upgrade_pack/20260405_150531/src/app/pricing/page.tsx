import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PricingGrid } from "@/components/pricing/pricing-grid";

export default function PricingPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Pricing"
        title="GBP plans built around real platform use"
        description="Each plan is structured around the actual workflow it unlocks. Unavailable features are visibly faded so the upgrade path is clear without being misleading."
      />

      <PricingGrid />
    </AppShell>
  );
}