import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

export default function AboutPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="About"
        title="Helping users make more informed betting decisions"
        description="MatchEdge is built to give users a clearer view of bookmaker pricing, potential inefficiencies, and strategy risk before they act."
      />

      <div className="max-w-4xl space-y-6 text-sm text-slate-300">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p>
            MatchEdge was created to help users make more informed choices by turning scattered bookmaker pricing
            into something structured, understandable, and actionable.
          </p>
          <p className="mt-4">
            The aim is not to encourage reckless betting. The aim is to give users better information, clearer
            calculations, and a more realistic view of both opportunity and exposure so they can operate with an
            upper hand where one genuinely exists.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">What MatchEdge Does</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>Aggregates odds across multiple bookmakers and exchanges.</li>
            <li>Highlights potential no-loss and low-risk matched betting opportunities.</li>
            <li>Shows stake splits, implied probability, profit margin, and qualifying loss where relevant.</li>
            <li>Lets users switch between qualifying, profit-only, and hybrid strategy rules.</li>
            <li>Helps users compare pricing rather than rely on guesswork or instinct.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">Our Approach</h2>
          <div className="mt-4 space-y-3">
            <p>
              We believe users are better served by transparency than hype. That means showing the upside when a
              real edge exists, but also making the risks visible when the margin is thin or execution risk is high.
            </p>
            <p>
              A mathematically favourable setup can still fail in the real world if odds move, if one leg is rejected,
              if limits are applied, or if the market changes before completion. That is why MatchEdge focuses on
              informed decision-making, not false promises.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">Important Disclaimer</h2>
          <p className="mt-4">
            MatchEdge is an informational and analytical tool. It does not guarantee profit, remove risk, or replace
            personal responsibility. All betting decisions remain the responsibility of the user.
          </p>
        </section>
      </div>
    </AppShell>
  );
}