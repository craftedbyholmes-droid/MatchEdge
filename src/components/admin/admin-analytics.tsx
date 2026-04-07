import { StatCard } from "@/components/ui/stat-card";

export function AdminAnalytics({ stats }: { stats: { profiles: number; chats: number; offersUsed: number; executionLogs: number; openPrivacyRequests: number; openBreaches: number; activeVendors: number; consents: number; }; }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Profiles" value={String(stats.profiles)} hint="Registered user profiles" />
      <StatCard label="Chats" value={String(stats.chats)} hint="Current collaboration spaces" />
      <StatCard label="Offers Used" value={String(stats.offersUsed)} hint="Tracked welcome/bonus usage" />
      <StatCard label="Execution Logs" value={String(stats.executionLogs)} hint="Recorded betting outcomes" />
      <StatCard label="Open Privacy Requests" value={String(stats.openPrivacyRequests)} hint="Access, erasure, restriction, rectification" />
      <StatCard label="Open Breaches" value={String(stats.openBreaches)} hint="Incident log requiring attention" />
      <StatCard label="Active Vendors" value={String(stats.activeVendors)} hint="Current external processors/providers" />
      <StatCard label="Consents Logged" value={String(stats.consents)} hint="Recorded privacy/cookie consents" />
    </div>
  );
}