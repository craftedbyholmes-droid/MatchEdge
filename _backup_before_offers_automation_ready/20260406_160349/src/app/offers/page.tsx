import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

const workflows = [
  {
    title: "Welcome Offer Workflow",
    body: "Use qualifying bets to unlock a reward, then convert the reward as efficiently as possible.",
    bullets: [
      "Identify bookmakers you have not used before.",
      "Place controlled qualifying bets with clear stake sizing.",
      "Wait for reward eligibility and track completion carefully.",
      "Use the compare and profit tools to extract value with discipline.",
    ],
  },
  {
    title: "Reload & Ongoing Value",
    body: "Once welcome offers are exhausted, the focus shifts to selective value rather than volume.",
    bullets: [
      "Check periodic bookmaker promos and reload offers.",
      "Avoid forcing low-edge opportunities for the sake of activity.",
      "Use the dashboard to track whether execution is genuinely profitable over time.",
      "Stay selective: a smaller number of better opportunities beats clutter.",
    ],
  },
  {
    title: "Execution Discipline",
    body: "The strongest edge still fails if stakes or prices are handled badly.",
    bullets: [
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
        {workflows.map((section) => (
          <div key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-2xl font-semibold">{section.title}</div>
            <p className="mt-3 text-sm text-slate-400">{section.body}</p>
            <div className="mt-4 grid gap-3">
              {section.bullets.map((bullet) => (
                <div key={bullet} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                  {bullet}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}