type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
};

type AdminGrantRow = {
  id: string;
  user_id: string;
  plan_key: string;
  access_type: string;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
};

type ResolvedRow = {
  user_id: string;
  effective_plan_key: string;
};

export function PlanDiagnosticPanel({
  profiles,
  grants,
  resolved,
}: {
  profiles: ProfileRow[];
  grants: AdminGrantRow[];
  resolved: ResolvedRow[];
}) {
  function userLabel(userId: string) {
    const profile = profiles.find((p) => p.id === userId);
    if (!profile) return userId;
    return profile.display_name || profile.username || profile.email || userId;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-lg font-semibold">Plan Resolution Diagnostic</div>
      <p className="mt-2 text-sm text-slate-400">
        This panel compares the currently active manual grant against the resolved effective plan. Billing is intentionally not used in this rewritten manual flow.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-cyan-300">Active admin grants</div>
          <div className="mt-3 space-y-3">
            {grants.length ? (
              grants.map((grant) => (
                <div key={grant.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-sm font-medium">{userLabel(grant.user_id)}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    Plan: {grant.plan_key.toUpperCase()} • {grant.access_type}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Starts: {new Date(grant.starts_at).toLocaleString()}
                    {grant.expires_at ? ` • Expires: ${new Date(grant.expires_at).toLocaleString()}` : ""}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Active flag: {grant.is_active ? "true" : "false"}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
                No active admin grants found.
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-cyan-300">Resolved effective plan</div>
          <div className="mt-3 space-y-3">
            {resolved.length ? (
              resolved.map((row) => (
                <div key={row.user_id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-sm font-medium">{userLabel(row.user_id)}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    Effective plan: {row.effective_plan_key.toUpperCase()}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
                No resolved plan rows found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}