import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

export default function TermsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Terms"
        title="Terms & Conditions"
        description="Use of MatchEdge is subject to the following conditions, disclaimers, and user responsibilities."
      />

      <div className="max-w-4xl space-y-6 text-sm text-slate-300">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">1. Informational Use Only</h2>
          <p className="mt-4">
            MatchEdge provides analytical information, pricing comparisons, and strategy support. It does not provide
            financial advice and does not guarantee profit.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">2. User Responsibility</h2>
          <p className="mt-4">
            Users are responsible for checking bookmaker rules, odds, market settlement terms, account status,
            geographic eligibility, and stake accuracy before placing any bet.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">3. Changing Odds and Market Risk</h2>
          <p className="mt-4">
            Odds can change at any time. A previously profitable or low-risk opportunity may become unprofitable
            before all legs are placed. MatchEdge is not liable for losses arising from price movement, delays,
            rejected bets, or incomplete coverage.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">4. Affiliate Disclosure</h2>
          <p className="mt-4">
            Some outbound links may be affiliate links. If a user signs up or places activity through those links,
            MatchEdge may receive compensation. This does not change the user’s responsibility to assess suitability
            and risk before acting.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">5. Age Restriction</h2>
          <p className="mt-4">
            MatchEdge is intended for users aged 18 or over only.
          </p>
        </section>
      </div>
    </AppShell>
  );
}