import Link from "next/link";
import { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { getEffectivePlanKey } from "@/lib/access";
import { AuthActions } from "@/components/layout/auth-actions";

const mainNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/compare", label: "Compare" },
  { href: "/plan", label: "Profit Plan" },
  { href: "/offers", label: "Offers" },
  { href: "/saved", label: "Saved Bets" },
  { href: "/alerts", label: "Alerts" },
  { href: "/responsible-gambling", label: "Responsible Gambling" },
  { href: "/chat", label: "Chat" },
  { href: "/admin", label: "Admin" },
];

const legalNav = [
  { href: "/settings", label: "Settings" },
  { href: "/privacy-centre", label: "Privacy Centre" },
  { href: "/privacy", label: "Privacy Notice" },
  { href: "/cookies", label: "Cookies" },
  { href: "/terms", label: "Terms" },
];

export async function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const effectivePlan = await getEffectivePlanKey(user.id);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="w-[340px] border-r border-white/10 bg-slate-950/90 p-5">
          <div className="sticky top-0">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                MatchEdge
              </div>
              <div className="mt-3 text-2xl font-semibold leading-tight">
                Matched Betting Platform
              </div>
              <div className="mt-3 text-sm text-slate-400">
                Real-time odds comparison, no-loss detection, qualifying bet planning,
                affiliate offers, premium tools, alerts, and admin tooling.
              </div>
            </div>

            <nav className="mt-5 space-y-3">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-base text-white transition hover:bg-white/[0.07]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
                Account & Legal
              </div>

              <div className="mt-4 space-y-3">
                {legalNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white transition hover:bg-slate-900"
                  >
                    {item.label}
                  </Link>
                ))}

                <AuthActions effectivePlan={effectivePlan} />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}