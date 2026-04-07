"use client";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
export function CookiePreferencesForm({ userId, initial }: { userId: string; initial: { essential: boolean; analytics: boolean; marketing: boolean; }; }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [state, setState] = useState(initial);
  const [status, setStatus] = useState("");
  async function save() {
    setStatus("Saving...");
    const { error } = await supabase.from("cookie_preferences").upsert({ user_id: userId, essential: true, analytics: state.analytics, marketing: state.marketing });
    if (error) { setStatus(error.message); return; }
    await supabase.from("privacy_consents").insert([
      { user_id: userId, consent_type: "analytics_cookies", granted: state.analytics, policy_version: "v1" },
      { user_id: userId, consent_type: "marketing_cookies", granted: state.marketing, policy_version: "v1" },
    ]);
    setStatus("Saved");
  }
  return <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"><div className="text-lg font-semibold">Cookie Preferences</div><p className="mt-2 text-sm text-slate-400">Essential cookies remain on. Analytics and marketing can be changed here at any time.</p><div className="mt-4 space-y-3"><Toggle label="Essential cookies" checked={true} disabled /><Toggle label="Analytics cookies" checked={state.analytics} onChange={(checked) => setState((prev) => ({ ...prev, analytics: checked }))} /><Toggle label="Marketing cookies" checked={state.marketing} onChange={(checked) => setState((prev) => ({ ...prev, marketing: checked }))} /></div><button type="button" onClick={save} className="mt-6 rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950">Save preferences</button>{status ? <div className="mt-3 text-sm text-slate-400">{status}</div> : null}</div>;
}
function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange?: (checked: boolean) => void; disabled?: boolean; }) {
  return <button type="button" disabled={disabled} onClick={() => onChange?.(!checked)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 disabled:cursor-default"><span className="text-sm text-slate-200">{label}</span><span className={`rounded-full px-3 py-1 text-xs ${checked ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-800 text-slate-400"}`}>{checked ? "On" : "Off"}</span></button>;
}