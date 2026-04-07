import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { plans } from "@/config/pricing";
import { requireUser } from "@/lib/auth";
import { getEffectivePlanKey } from "@/lib/access";

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ required?: string }>;
}) {
  const user = await requireUser();
  const effectivePlan = await getEffectivePlanKey(user.id);
  const params = (await searchParams) || {};
  const required = String(params.required || "").toLowerCase();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Pricing"
        title="Choose the right MatchEdge package"
        description="All visible plan badges and highlighted tiers now follow the resolved effective plan, including manual admin overrides."
      />

      {required ? (
        <div className="mb-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          The feature you tried to open requires the <span className="font-semibold uppercase">{required}</span> tier or above.
        </div>
      ) : null}

      <div className="mb-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5 text-sm text-cyan-100">
        Your current effective plan is <span className="font-semibold uppercase">{effectivePlan}</span>.
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.key === effectivePlan;
          const featured = plan.key === "pro";

          return (
            <div
              key={plan.key}
              className={`rounded-3xl border p-6 ${
                isCurrent
                  ? "border-cyan-400/40 bg-cyan-500/10"
                  : featured
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                  {plan.tagline}
                </div>
                {isCurrent ? (
                  <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-100">
                    Current plan
                  </div>
                ) : null}
              </div>

              <div className="mt-3 text-3xl font-semibold">{plan.name}</div>
              <div className="mt-2 text-2xl font-semibold">
                {plan.priceMonthly}
                <span className="text-base text-slate-400"> / month</span>
              </div>
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

              {isCurrent ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950 px-5 py-3 text-center text-sm font-medium text-white">
                  Already active via effective plan
                </div>
              ) : (
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
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}