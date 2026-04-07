import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { plans } from "@/config/pricing";

export default function PricingPage({
  searchParams,
}: {
  searchParams?: { required?: string };
}) {
  const required = String(searchParams?.required || "").toLowerCase();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Pricing"
        title="Choose the right MatchEdge package"
        description="Premium is the serious working tier. Pro is for users who want stronger 7-day filtering, higher-quality selection, and tighter capital efficiency."
      />

      {required ? (
        <div className="mb-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          The feature you tried to open requires the <span className="font-semibold uppercase">{required}</span> tier or above.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        {plans.map((plan) => {
          const featured = plan.key === "pro";

          return (
            <div
              key={plan.key}
              className={`rounded-3xl border p-6 ${
                featured
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{plan.tagline}</div>
              <div className="mt-3 text-3xl font-semibold">{plan.name}</div>
              <div className="mt-2 text-2xl font-semibold">{plan.priceMonthly}<span className="text-base text-slate-400"> / month</span></div>
              <p className="mt-4 text-sm text-slate-300">{plan.description}</p>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div
                    key={feature.label}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      feature.included
                        ? "border-white/10 bg-slate-950/60 text-white"
                        : "border-white/5 bg-slate-900/50 text-slate-500"
                    }`}
                  >
                    {feature.label}
                  </div>
                ))}
              </div>

              <Link
                href="/pricing"
                className={`mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-medium ${
                  featured
                    ? "bg-emerald-500 text-slate-950"
                    : "border border-white/10 bg-slate-950 text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}