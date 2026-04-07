import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

export default function ResponsibleGamblingPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Responsible Gambling"
        title="Safer betting and support resources"
        description="Use the platform as an informational tool, not as a guarantee of profit. Stay aware of risk, changing odds, and the limits of any strategy."
      />

      <div className="max-w-4xl space-y-6 text-sm text-slate-300">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">Important Principles</h2>
          <div className="mt-4 space-y-3">
            <p>
              MatchEdge is designed to help users analyse odds and identify potentially favourable setups,
              but it does not remove risk. Execution delays, odds movement, restrictions, incomplete coverage,
              and human error can all change the final outcome.
            </p>
            <p>
              Only use money you can afford to lose. Never chase losses, and do not treat a calculated edge as
              a guaranteed return.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">Use the Platform Responsibly</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>Set a betting budget before you begin and stick to it.</li>
            <li>Re-check all prices before placing each leg of a strategy.</li>
            <li>Do not increase stakes impulsively after a missed opportunity.</li>
            <li>Take breaks and step away if betting stops feeling controlled.</li>
            <li>Remember that bookmaker limits, account restrictions, and rule differences can apply.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">Support Resources</h2>
          <div className="mt-4 space-y-3">
            <p>If gambling is becoming difficult to control, support is available:</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.begambleaware.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-emerald-200"
                >
                  BeGambleAware
                </a>
              </li>
              <li>
                <a
                  href="https://www.gamcare.org.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-emerald-200"
                >
                  GamCare
                </a>
              </li>
              <li>
                <a
                  href="https://www.gamblingcommission.gov.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-emerald-200"
                >
                  UK Gambling Commission
                </a>
              </li>
            </ul>
            <p className="text-xs text-slate-500">18+ only. Gamble responsibly.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}