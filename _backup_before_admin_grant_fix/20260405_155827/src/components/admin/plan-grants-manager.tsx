"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
};

type GrantRow = {
  id: string;
  user_id: string;
  plan_key: string;
  access_type: string;
  starts_at: string;
  expires_at: string | null;
  note: string | null;
  is_active: boolean;
  profiles?: {
    email: string | null;
    username: string | null;
    display_name: string | null;
  } | null;
};

export function PlanGrantsManager({
  profiles,
  activeGrants,
  adminUserId,
}: {
  profiles: ProfileRow[];
  activeGrants: GrantRow[];
  adminUserId: string;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = useState(profiles[0]?.id || "");
  const [planKey, setPlanKey] = useState("premium");
  const [accessType, setAccessType] = useState("permanent");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  async function createGrant() {
    if (!userId) {
      setStatus("Select a user first.");
      return;
    }

    if (accessType === "time_limited" && !expiresAt) {
      setStatus("Choose an expiry date for time-limited access.");
      return;
    }

    setStatus("Saving grant...");

    const payload = {
      user_id: userId,
      granted_by_user_id: adminUserId,
      plan_key: planKey,
      access_type: accessType,
      starts_at: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
      expires_at: accessType === "time_limited" ? new Date(expiresAt).toISOString() : null,
      note: note || null,
      is_active: true,
    };

    const { error } = await supabase.from("admin_plan_grants").insert(payload);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Grant created. Reload to see the updated list.");
    setNote("");
    setStartsAt("");
    setExpiresAt("");
  }

  async function revokeGrant(grantId: string) {
    setStatus("Revoking grant...");

    const { error } = await supabase
      .from("admin_plan_grants")
      .update({ is_active: false })
      .eq("id", grantId);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Grant revoked. Reload to see the updated list.");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-lg font-semibold">Manual Plan Access</div>
        <p className="mt-2 text-sm text-slate-400">
          Grant users Free, Premium, or Pro manually. Admin grants override paid-plan sync while active.
        </p>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          >
            <option value="">Select user</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.display_name || profile.username || profile.email || profile.id}
              </option>
            ))}
          </select>

          <select
            value={planKey}
            onChange={(e) => setPlanKey(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          >
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="pro">Pro</option>
          </select>

          <select
            value={accessType}
            onChange={(e) => setAccessType(e.target.value)}
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
            placeholder="Starts now if left blank"
          />

          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={accessType !== "time_limited"}
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none disabled:opacity-40"
            placeholder="Expiry"
          />

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            placeholder="Optional note"
          />
        </div>

        <button
          type="button"
          onClick={createGrant}
          className="mt-4 rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
        >
          Save Grant
        </button>

        {status ? <div className="mt-3 text-sm text-slate-400">{status}</div> : null}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-lg font-semibold">Active Manual Grants</div>
        <div className="mt-4 space-y-3">
          {activeGrants.length ? (
            activeGrants.map((grant) => (
              <div key={grant.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {grant.profiles?.display_name || grant.profiles?.username || grant.profiles?.email || grant.user_id}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {grant.plan_key.toUpperCase()} • {grant.access_type === "time_limited" ? "Time-limited" : "Permanent"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Starts: {new Date(grant.starts_at).toLocaleString()}
                      {grant.expires_at ? ` • Expires: ${new Date(grant.expires_at).toLocaleString()}` : ""}
                    </div>
                    {grant.note ? <div className="mt-2 text-sm text-slate-400">{grant.note}</div> : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => revokeGrant(grant.id)}
                    className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-400">No active manual grants yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}