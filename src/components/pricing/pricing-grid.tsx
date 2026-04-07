"use client";

import { useState } from "react";
import { pricingPlans, type PlanKey } from "@/lib/plans";

export function PricingGrid() {
  const [status, setStatus] = useState("");

  async function startCheckout(planKey: PlanKey) {
    if (planKey === "free") {
      window.location.href = "/compare";
      return;
    }

    setStatus("Opening checkout...");

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ planKey }),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      setStatus(json.error || "Unable to start checkout.");
      return;
    }

    if (json.url) {
      window.location.href = json.url;
      return;
    }

    setStatus("Stripe checkout URL not returned.");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-6 xl:grid-cols-3">
        {pricingPlans.map((plan) => (
          <div key={plan.key} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xl font-semibold">{plan.name}</div>
            <div className="mt-2 text-sm text-emerald-300">{plan.strapline}</div>
            <div className="mt-4 flex items-end gap-2">
              <div className="text-4xl font-semibold">£{plan.priceGbp}</div>
              <div className="pb-1 text-sm text-slate-400">{plan.periodLabel}</div>
            </div>
            <p className="mt-3 text-sm text-slate-400">{plan.summary}</p>

            <div className="mt-6 space-y-2">
              {plan.features.map((feature) => (
                <div
                  key={feature.label}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    feature.included
                      ? "border-emerald-500/20 bg-emerald-500/10 text-slate-100"
                      : "border-white/10 bg-slate-950/60 text-slate-500 opacity-55"
                  }`}
                >
                  {feature.label}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => startCheckout(plan.key)}
              className={`mt-6 w-full rounded-2xl px-5 py-3 font-medium ${
                plan.key === "free"
                  ? "border border-white/10 bg-slate-900 text-white"
                  : "bg-emerald-500 text-slate-950"
              }`}
            >
              {plan.key === "free" ? "Continue on Free" : `Choose ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {status ? <div className="text-sm text-slate-400">{status}</div> : null}
    </div>
  );
}