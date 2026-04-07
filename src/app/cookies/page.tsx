import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

export default function CookiesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Cookies"
        title="Cookies & Similar Technologies"
        description="We only use what’s necessary for core account features, and you stay in control of optional choices."
      />

      <div className="max-w-4xl space-y-6 text-sm text-slate-300">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-lg font-semibold">Essential cookies</div>
          <p className="mt-2 text-sm text-slate-400">
            These cookies are required for the app to work properly. They keep you signed in, protect your account, and make sure your settings and activity are remembered while you use the platform.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Without these, features like logging in, saving bets, and using your dashboard won’t function correctly.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-lg font-semibold">Optional cookies</div>
          <p className="mt-2 text-sm text-slate-400">
            These help us improve your experience by understanding how the app is used and by showing more relevant content and offers.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            You can turn these on or off at any time. They are never required to use the core features of the platform.
          </p>
        </div>
      </div>
    </AppShell>
  );
}