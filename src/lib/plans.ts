export type PlanKey = "free" | "premium" | "pro";

export type PlanFeature = {
  label: string;
  included: boolean;
};

export type PricingPlan = {
  key: PlanKey;
  name: string;
  priceGbp: number;
  periodLabel: string;
  strapline: string;
  summary: string;
  stripePriceEnv: string;
  features: PlanFeature[];
};

export const pricingPlans: PricingPlan[] = [
  {
    key: "free",
    name: "Free",
    priceGbp: 0,
    periodLabel: "/month",
    strapline: "Get familiar with the platform",
    summary: "Good for exploring the compare flow, viewing active opportunities, and testing the product before upgrading.",
    stripePriceEnv: "STRIPE_PRICE_FREE_GBP",
    features: [
      { label: "Core compare page access", included: true },
      { label: "Basic dashboard overview", included: true },
      { label: "Manual privacy controls", included: true },
      { label: "Profit plan workflow", included: false },
      { label: "Advanced alert controls", included: false },
      { label: "Expanded execution analytics", included: false },
      { label: "Priority refresh limits", included: false },
    ],
  },
  {
    key: "premium",
    name: "Premium",
    priceGbp: 19,
    periodLabel: "/month",
    strapline: "For active matched betting users",
    summary: "Designed for users who want a stronger day-to-day workflow, better filtering, and more useful execution support.",
    stripePriceEnv: "STRIPE_PRICE_PREMIUM_GBP",
    features: [
      { label: "Core compare page access", included: true },
      { label: "Basic dashboard overview", included: true },
      { label: "Manual privacy controls", included: true },
      { label: "Profit plan workflow", included: true },
      { label: "Advanced alert controls", included: true },
      { label: "Expanded execution analytics", included: true },
      { label: "Priority refresh limits", included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    priceGbp: 39,
    periodLabel: "/month",
    strapline: "For serious users who want the full workflow",
    summary: "Built for users who want the strongest execution experience, deeper performance visibility, and premium access across the platform.",
    stripePriceEnv: "STRIPE_PRICE_PRO_GBP",
    features: [
      { label: "Core compare page access", included: true },
      { label: "Basic dashboard overview", included: true },
      { label: "Manual privacy controls", included: true },
      { label: "Profit plan workflow", included: true },
      { label: "Advanced alert controls", included: true },
      { label: "Expanded execution analytics", included: true },
      { label: "Priority refresh limits", included: true },
    ],
  },
];

export function getPlanPriceId(planKey: PlanKey) {
  const plan = pricingPlans.find((x) => x.key === planKey);
  if (!plan) return "";
  return process.env[plan.stripePriceEnv] || "";
}