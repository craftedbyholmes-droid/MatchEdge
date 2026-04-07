import Link from "next/link";
import { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Bot,
  Gift,
  GanttChartSquare,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Star,
} from "lucide-react";
import { AuthActions } from "@/components/layout/auth-actions";
import { GambleAwareBadge } from "@/components/global/gamble-aware-badge";
import { CookieBanner } from "@/components/privacy/cookie-banner";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compare", label: "Compare", icon: BarChart3 },
  { href: "/plan", label: "Profit Plan", icon: GanttChartSquare },
  { href: "/offers", label: "Offers", icon: Gift },
  { href: "/saved", label: "Saved Bets", icon: Star },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/responsible-gambling", label: "Responsible Gambling", icon: Shield },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/admin", label: "Admin", icon: Bot },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <GambleAwareBadge />
      <CookieBanner />

      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[290px_1fr]">
        <aside className="border-r border-white/10 bg-slate-900/80 p-6">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.35em] text-emerald-400">MatchEdge</div>
            <div className="mt-2 text-2xl font-semibold">Matched Betting Platform</div>
            <p className="mt-2 text-sm text-slate-400">
              Real-time odds comparison, no-loss detection, qualifying bet planning, affiliate offers, premium tools, alerts, and admin tooling.
            </p>
          </div>

          <nav className="space-y-2">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-500/40 hover:bg-emerald-500/10"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <AuthActions />
        </aside>

        <main className="p-6 lg:p-8">
          <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 p-6">
            <div className="text-xs uppercase tracking-[0.35em] text-emerald-300">Matched Betting Intelligence Platform</div>
            <h1 className="mt-2 text-3xl font-semibold">Real-time arbitrage detection and risk-aware opportunity analysis</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Live odds aggregation across bookmakers and exchanges with no-loss detection, qualifying support, privacy controls, and user-configurable strategy rules.
            </p>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}