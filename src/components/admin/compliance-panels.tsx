export function CompliancePanels({ privacyRequests, breaches, vendors, allowlist }: { privacyRequests: any[]; breaches: any[]; vendors: any[]; allowlist: string[]; }) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-lg font-semibold">Open Privacy Requests</div>
        <div className="mt-4 space-y-3">
          {privacyRequests.length ? privacyRequests.map((row) => (
            <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-sm font-medium capitalize">{row.request_type}</div>
              <div className="mt-1 text-xs text-slate-500">{row.status} • {new Date(row.created_at).toLocaleString()}</div>
              <div className="mt-2 text-sm text-slate-400">{row.request_details || "No details provided"}</div>
            </div>
          )) : <div className="text-sm text-slate-400">No open privacy requests.</div>}
        </div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-lg font-semibold">Breach & Incident Log</div>
        <div className="mt-4 space-y-3">
          {breaches.length ? breaches.map((row) => (
            <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-sm font-medium">{row.title}</div>
              <div className="mt-1 text-xs text-slate-500">{row.severity} • reportable: {row.reportable ? "yes" : "no"} • {row.status}</div>
              <div className="mt-2 text-sm text-slate-400">{row.description || "No description recorded"}</div>
            </div>
          )) : <div className="text-sm text-slate-400">No logged incidents.</div>}
        </div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-lg font-semibold">Vendor Register & Admin Access</div>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="text-sm font-medium">Admin allowlist</div>
            <div className="mt-2 text-sm text-slate-400">{allowlist.join(", ") || "None configured"}</div>
          </div>
          {vendors.length ? vendors.map((row) => (
            <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-sm font-medium">{row.vendor_name}</div>
              <div className="mt-1 text-xs text-slate-500">{row.lawful_basis || "No lawful basis recorded"} • {row.location || "Location unset"}</div>
              <div className="mt-2 text-sm text-slate-400">{row.purpose}</div>
            </div>
          )) : <div className="text-sm text-slate-400">No vendors recorded.</div>}
        </div>
      </section>
    </div>
  );
}