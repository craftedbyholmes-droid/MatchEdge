"use client";

import { useMemo, useState } from "react";

type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
};

type ActiveGrantRow = {
  id: string;
  user_id: string;
  plan_key: string;
  access_type: string;
  starts_at: string;
  expires_at: string | null;
  note: string | null;
  is_active: boolean;
  profiles?: {
    email?: string | null;
    username?: string | null;
    display_name?: string | null;
  } | null;
};

export function PlanGrantsManager({
  profiles,
  activeGrants,
  adminUserId,
}: {
  profiles: ProfileRow[];
  activeGrants: ActiveGrantRow[];
  adminUserId: string;
}) {
  const [userId, setUserId] = useState(profiles[0]?.id || "");
  const [planKey, setPlanKey] = useState<"free" | "premium" | "pro">("premium");
  const [accessType, setAccessType] = useState<"permanent" | "time_limited">("permanent");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  const profileOptions = useMemo(() => {
    return profiles.map((profile) => ({
      id: profile.id,
      label:
        profile.display_name ||
        profile.username ||
        profile.email ||
        profile.id,
    }));
  }, [profiles]);

  async function handleSaveGrant() {
    if (!userId) {
      setStatus("Select a user first.");
      return;
    }

    if (accessType === "time_limited" && !expiresAt) {
      setStatus("Choose an expiry date for time-limited access.");
      return;
    }

    setStatus("Saving grant...");

    const response = await fetch("/api/admin/plan-grants", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        userId,
        grantedByUserId: adminUserId,
        planKey,
        accessType,
        startsAt: startsAt || null,
        expiresAt: accessType === "time_limited" ? expiresAt : null,
        note: note || null,
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.ok) {
      setStatus(json.error || "Unable to save grant.");
      return;
    }

    setStatus("Grant saved. Refresh admin to confirm the resolved plan.");
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-lg font-semibold">Manual Plan Access</div>
      <p className="mt-2 text-sm text-slate-400">
        Grant users Free, Premium, or Pro manually. Saving a new grant now replaces any older active grant for that user.
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
        >
          {profileOptions.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))}
        </select>

        <select
          value={planKey}
          onChange={(e) => setPlanKey(e.target.value as "free" | "premium" | "pro")}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
        >
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="pro">Pro</option>
        </select>

        <select
          value={accessType}
          onChange={(e) => setAccessType(e.target.value as "permanent" | "time_limited")}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
        >
          <option value="permanent">Permanent access</option>
          <option value="time_limited">Time-limited access</option>
        </select>

        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
        />

        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          disabled={accessType !== "time_limited"}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none disabled:opacity-50"
        />

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
        />
      </div>

      <button
        type="button"
        onClick={handleSaveGrant}
        className="mt-4 rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
      >
        Save Grant
      </button>

      {status ? <div className="mt-3 text-sm text-slate-400">{status}</div> : null}

      <div className="mt-8">
        <div className="text-lg font-semibold">Active Manual Grants</div>
        <div className="mt-4 space-y-3">
          {activeGrants.length ? (
            activeGrants.map((grant) => (
              <div key={grant.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-sm font-medium">
                  {grant.profiles?.display_name || grant.profiles?.username || grant.profiles?.email || grant.user_id}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {grant.plan_key.toUpperCase()} • {grant.access_type}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Starts: {new Date(grant.starts_at).toLocaleString()}
                  {grant.expires_at ? ` • Expires: ${new Date(grant.expires_at).toLocaleString()}` : ""}
                </div>
                {grant.note ? <div className="mt-1 text-xs text-slate-500">{grant.note}</div> : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
              No active manual grants yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}