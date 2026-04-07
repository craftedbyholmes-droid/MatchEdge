import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { OffersGrid } from "@/components/offers/offers-grid";
import { getOffersPageData } from "@/lib/offers";

export default async function OffersPage() {
  let offers = [];
  let error = "";

  try {
    offers = await getOffersPageData("uk");
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown offers error";
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Offers"
        title="Verified welcome, reload, and bonus offers"
        description="This page is now ready for structured admin entry first, with future import and feed automation layered on top."
      />

      {error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error}
        </div>
      ) : (
        <OffersGrid offers={offers as any} />
      )}
    </AppShell>
  );
}