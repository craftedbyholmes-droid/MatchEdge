export type PricingPlan = {
  key: "free" | "premium" | "pro";
  name: string;
  priceMonthly: string;
  tagline: string;
  description: string;
  cta: string;
  features: Array<{ label: string; included: boolean }>;
};

export const plans: PricingPlan[] = [
  {
    key: "free",
    name: "Free",
    priceMonthly: "£0",
    tagline: "Explore the market",
    description:
      "For users who want a clean view of bookmaker opportunities and core account tools before stepping into heavier planning.",
    cta: "Current baseline",
    features: [
      { label: "Core compare view", included: true },
      { label: "Standard bookmaker links", included: true },
      { label: "Basic dashboard access", included: true },
      { label: "Execution history foundation", included: false },
      { label: "Weekly profit planner", included: false },
      { label: "Alerts and monitoring", included: false },
      { label: "PRO 7-day filter controls", included: false },
    ],
  },
  {
    key: "premium",
    name: "Premium",
    priceMonthly: "£12.99",
    tagline: "The working matched betting toolkit",
    description:
      "For active users who want structured planning, alerts, execution tracking, and a more disciplined workflow without stepping into the highest-intelligence filter layer.",
    cta: "Most useful for active users",
    features: [
      { label: "Core compare view", included: true },
      { label: "Weekly profit planner", included: true },
      { label: "Execution tracking", included: true },
      { label: "Alerts and monitoring", included: true },
      { label: "Bankroll planning modes", included: true },
      { label: "Chat collaboration tools", included: true },
      { label: "PRO minimum profit % filters", included: false },
      { label: "PRO ranked 7-day selection controls", included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    priceMonthly: "£24.99",
    tagline: "Higher-quality planning and smarter capital allocation",
    description:
      "For users who want fewer, stronger opportunities. PRO adds the 7-day intelligence layer, minimum profit filtering, ranking controls, and more capital-efficient planning.",
    cta: "Unlock the strongest planner tools",
    features: [
      { label: "Core compare view", included: true },
      { label: "Weekly profit planner", included: true },
      { label: "Execution tracking", included: true },
      { label: "Alerts and monitoring", included: true },
      { label: "Bankroll planning modes", included: true },
      { label: "Chat collaboration tools", included: true },
      { label: "PRO minimum profit % filters", included: true },
      { label: "PRO ranked 7-day selection controls", included: true },
      { label: "Higher-efficiency opportunity selection", included: true },
    ],
  },
];