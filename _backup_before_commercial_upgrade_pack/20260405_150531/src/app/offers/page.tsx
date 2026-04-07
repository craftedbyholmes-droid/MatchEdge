import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

const offerGroups = [
  {
    title: "Welcome Offer Workflow",
    description: "Use qualifying bets to unlock a reward, then convert the reward as efficiently as possible.",
    points: [
      "Identify bookmakers you have not used before.",
      "Place controlled qualifying bets with clear stake sizing.",
      "Wait for reward eligibility and track completion carefully.",
      "Use the compare and profit tools to extract value with discipline.",
    ],
  },
  {
    title: "Reload & Ongoing Value",
    description: "Once welcome offers are exhausted, the focus shifts to selective value rather than volume.",
    points: [
      "Check periodic bookmaker promos and reload offers.",
      "Avoid forcing low-edge opportunities for the sake of activity.",
      "Use the dashboard to track whether execution is genuinely profitable over time.",
      "Stay selective: a smaller number of better opportunities beats clutter.",
    ],
  },
  {
    title: "Execution Discipline",
    description: "The strongest edge still fails if stakes or prices are handled badly.",
    points: [
      "Always re-check odds before final confirmation.",
      "Use the last profitable price markers where shown.",
      "Take extra care when margins are thin.",
      "Record outcomes properly so your dashboard reflects reality.",
    ],
  },
];

export default function OffersPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Offers"
        title="Offer strategies and bookmaker workflows"
        description="A clearer launch-ready offers page focused on welcome offers, ongoing value, and disciplined execution rather than filler content."
      />

      <div className="space-y-6">
        {offerGroups.map((group) => (
          <section key={group.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xl font-semibold">{group.title}</div>
            <p className="mt-3 text-sm text-slate-400">{group.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {group.points.map((point) => (
                <li key={point}>• {point}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  );
}